"""Shared test fixtures and helpers for AI service tests."""
import hashlib
import hmac
import json
import os
import time

import pytest
import httpx

# Set mock provider before importing the app
os.environ["AI_PROVIDER"] = "mock"
os.environ["AI_SERVICE_SECRET"] = "dev-ai-service-secret-change-in-production-32"

from src.main import app  # noqa: E402


@pytest.fixture
def client():
    """ASGI test client using ASGITransport."""
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://test")


def make_hmac_headers(body: dict) -> tuple[dict, bytes]:
    """Generate valid HMAC service-to-service auth headers.

    Returns (headers, body_bytes) so callers can pass the exact same bytes
    to the request (ensuring the HMAC matches what the server computes).
    """
    secret = os.environ.get("AI_SERVICE_SECRET", "dev-ai-service-secret-change-in-production-32")
    # Use compact, deterministic serialization
    body_bytes = json.dumps(body, separators=(",", ":")).encode()
    ts = str(int(time.time() * 1000))
    body_hash = hashlib.sha256(body_bytes).hexdigest()
    message = f"{ts}.{body_hash}"
    token = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()
    headers = {
        "Content-Type": "application/json",
        "X-Service-Token": token,
        "X-Timestamp": ts,
    }
    return headers, body_bytes
