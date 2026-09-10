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


rate_limiter = InMemoryRateLimiter(
    max_requests=settings.RATE_LIMIT_PER_MINUTE * 2,
    window_seconds=60
)
