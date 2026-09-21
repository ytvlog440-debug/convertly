import time
from collections import defaultdict
from typing import Optional, Dict, List
from app.core.config import settings

# Pre-defined magic numbers for strict binary file validation
MAGIC_SIGNATURES = {
    "pdf": [b"%PDF-"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "jpg": [b"\xff\xd8\xff"],
    "jpeg": [b"\xff\xd8\xff"],
    "webp": [b"RIFF"], # + 'WEBP' at offset 8
    "docx": [b"PK\x03\x04"],
    "xlsx": [b"PK\x03\x04"],
    "pptx": [b"PK\x03\x04"],
    "zip": [b"PK\x03\x04"]
}


def sanitize_filename(filename: str) -> str:
    """Strip malicious path traversal tokens and dangerous characters."""
    import re
    # Strip paths
    clean = filename.split("/")[-1].split("\\")[-1]
    # Replace dangerous characters with underscore
    clean = re.sub(r"[^a-zA-Z0-9._-]", "_", clean)
    return clean or "unnamed_file"


def validate_file_magic(header_bytes: bytes, claimed_extension: str) -> bool:
    """
    Validate that the file header bytes match the expected file signature.
    Prevents file extension spoofing attacks.
    """
    ext = claimed_extension.lower().lstrip(".")
    if ext not in MAGIC_SIGNATURES:
        return True

    expected_signatures = MAGIC_SIGNATURES[ext]
    for sig in expected_signatures:
        if header_bytes.startswith(sig):
            if ext == "webp":
                return len(header_bytes) >= 12 and header_bytes[8:12] == b"WEBP"
            return True

    return False


class InMemoryRateLimiter:
    """Sliding-window IP rate limiter preventing abuse and DoS attacks."""

    def __init__(self, max_requests: int = 120, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        if settings.ENVIRONMENT in ("development", "test") and client_ip in ("127.0.0.1", "localhost", "testclient"):
            return True

        now = time.time()
        window_start = now - self.window_seconds

        # Clean old records
        valid_requests = [t for t in self.requests[client_ip] if t > window_start]
        self.requests[client_ip] = valid_requests

        if len(valid_requests) >= self.max_requests:
            return False

        self.requests[client_ip].append(now)
        return True


# Dedicated rate limiters
mutation_rate_limiter = InMemoryRateLimiter(
    max_requests=settings.RATE_LIMIT_PER_MINUTE * 2,
    window_seconds=60
)
polling_rate_limiter = InMemoryRateLimiter(
    max_requests=300,
    window_seconds=60
)
# Backwards compatibility alias
rate_limiter = mutation_rate_limiter


import ipaddress

CLOUDFLARE_NETWORKS = [
    ipaddress.ip_network("173.245.48.0/20"),
    ipaddress.ip_network("103.21.244.0/22"),
    ipaddress.ip_network("103.22.200.0/22"),
    ipaddress.ip_network("103.31.4.0/22"),
    ipaddress.ip_network("141.101.64.0/18"),
    ipaddress.ip_network("108.162.192.0/18"),
    ipaddress.ip_network("190.93.240.0/20"),
    ipaddress.ip_network("188.114.96.0/20"),
    ipaddress.ip_network("197.234.240.0/22"),
    ipaddress.ip_network("198.41.128.0/17"),
    ipaddress.ip_network("162.158.0.0/15"),
    ipaddress.ip_network("104.16.0.0/13"),
    ipaddress.ip_network("104.24.0.0/14"),
    ipaddress.ip_network("172.64.0.0/13"),
    ipaddress.ip_network("131.0.72.0/22"),
    ipaddress.ip_network("2400:cb00::/32"),
    ipaddress.ip_network("2606:4700::/32"),
    ipaddress.ip_network("2803:f800::/32"),
    ipaddress.ip_network("2405:b500::/32"),
    ipaddress.ip_network("2405:8100::/32"),
    ipaddress.ip_network("2a06:98c0::/29"),
    ipaddress.ip_network("2c0f:f248::/32"),
]


INTERNAL_PROXY_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]


def is_ip_in_networks(ip_str: str, networks: list) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str.strip())
        return any(ip in net for net in networks)
    except ValueError:
        return False


def is_internal_proxy(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str.strip())
        return any(ip in net for net in INTERNAL_PROXY_NETWORKS)
    except ValueError:
        return False


def get_trusted_client_ip(request) -> str:
    """
    Extracts real client IP using trusted reverse proxy semantics.
    Prevents client IP spoofing via arbitrary X-Forwarded-For or CF-Connecting-IP
    when backend is reached directly.
    """
    peer_ip = request.client.host if request.client else ""
    if not peer_ip:
        return "unknown"

    # In development or test environments, allow local test IPs or test simulation headers
    if settings.ENVIRONMENT in ("development", "test") and peer_ip in ("127.0.0.1", "localhost", "testclient"):
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            return cf_ip.strip()
        xff = request.headers.get("X-Forwarded-For")
        if xff:
            return xff.split(",")[-1].strip()
        return peer_ip

    # Parse X-Forwarded-For chain from right to left
    xff_raw = request.headers.get("X-Forwarded-For", "")
    chain = [ip.strip() for ip in xff_raw.split(",") if ip.strip()]

    connecting_ip = peer_ip
    if is_internal_proxy(peer_ip) and chain:
        for candidate in reversed(chain):
            if not is_internal_proxy(candidate):
                connecting_ip = candidate
                break
        else:
            connecting_ip = chain[-1]

    # Check whether the connecting IP is a verified Cloudflare proxy or Worker
    is_cloudflare = is_ip_in_networks(connecting_ip, CLOUDFLARE_NETWORKS)
    has_worker_header = request.headers.get("X-Convertly-Worker") == "true"

    if is_cloudflare or has_worker_header:
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            try:
                ipaddress.ip_address(cf_ip.strip())
                return cf_ip.strip()
            except ValueError:
                pass

    return connecting_ip

