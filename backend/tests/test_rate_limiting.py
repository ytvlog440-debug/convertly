import pytest
from unittest.mock import MagicMock
from app.core.security import (
    InMemoryRateLimiter,
    get_trusted_client_ip,
    is_ip_in_networks,
    CLOUDFLARE_NETWORKS,
)
from app.core.config import settings


def test_rate_limiter_sliding_window():
    """Verify rate limiter allows requests up to max_requests and blocks afterwards."""
    # Test with non-local IP to bypass dev/test whitelist
    limiter = InMemoryRateLimiter(max_requests=5, window_seconds=60)
    test_ip = "198.51.100.25"

    for _ in range(5):
        assert limiter.is_allowed(test_ip) is True

    # 6th request must be rejected
    assert limiter.is_allowed(test_ip) is False


def test_rate_limiter_whitelist_in_dev_test():
    """Localhost and testclient IPs bypass rate limits in dev/test environment."""
    limiter = InMemoryRateLimiter(max_requests=2, window_seconds=60)
    for _ in range(10):
        assert limiter.is_allowed("127.0.0.1") is True
        assert limiter.is_allowed("testclient") is True


def test_cloudflare_network_detection():
    """Verify Cloudflare network detection for known Cloudflare edge IPs."""
    # Known Cloudflare IPv4 ranges
    assert is_ip_in_networks("173.245.48.5", CLOUDFLARE_NETWORKS) is True
    assert is_ip_in_networks("104.16.1.1", CLOUDFLARE_NETWORKS) is True
    assert is_ip_in_networks("162.158.0.10", CLOUDFLARE_NETWORKS) is True
    assert is_ip_in_networks("172.64.0.1", CLOUDFLARE_NETWORKS) is True

    # Non-Cloudflare public IPs
    assert is_ip_in_networks("8.8.8.8", CLOUDFLARE_NETWORKS) is False
    assert is_ip_in_networks("104.24.1.1", CLOUDFLARE_NETWORKS) is True
    assert is_ip_in_networks("203.0.113.195", CLOUDFLARE_NETWORKS) is False


def test_trusted_client_ip_rejects_spoofed_cf_header_from_public():
    """Direct public connection cannot spoof CF-Connecting-IP."""
    orig_env = settings.ENVIRONMENT
    try:
        settings.ENVIRONMENT = "production"

        mock_request = MagicMock()
        # Direct attacker connecting from 203.0.113.50 via Railway proxy (10.0.0.1)
        mock_request.client.host = "10.0.0.1"
        mock_request.headers = {
            "X-Forwarded-For": "1.2.3.4, 203.0.113.50",
            "CF-Connecting-IP": "8.8.8.8", # Spoofed CF header
        }

        # Connecting IP is 203.0.113.50 (not Cloudflare). Spoofed 8.8.8.8 and 1.2.3.4 must be ignored.
        ip = get_trusted_client_ip(mock_request)
        assert ip == "203.0.113.50"
    finally:
        settings.ENVIRONMENT = orig_env


def test_trusted_client_ip_accepts_cf_connecting_ip_from_cloudflare():
    """Requests routed through Cloudflare edge or verified Worker trust CF-Connecting-IP."""
    orig_env = settings.ENVIRONMENT
    try:
        settings.ENVIRONMENT = "production"

        mock_request = MagicMock()
        # Connection from Cloudflare edge IP 172.64.100.5 via Railway proxy (10.0.0.1)
        mock_request.client.host = "10.0.0.1"
        mock_request.headers = {
            "X-Forwarded-For": "198.51.100.77, 172.64.100.5",
            "CF-Connecting-IP": "198.51.100.77",
            "X-Convertly-Worker": "true",
        }

        ip = get_trusted_client_ip(mock_request)
        assert ip == "198.51.100.77"
    finally:
        settings.ENVIRONMENT = orig_env


def test_middleware_rate_limiting_integration(client):
    """Test API middleware allows normal requests and returns security headers."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
