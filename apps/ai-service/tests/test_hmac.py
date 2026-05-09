"""Tests for HMAC service-to-service authentication."""
import pytest


@pytest.mark.asyncio
async def test_no_auth_headers_returns_401(client):
    """Request without auth headers should return 401."""
    import json as _json
    body = {"prompt": "test", "destination": "Goa", "nights": 3, "budget_band": "moderate", "currency": "INR", "preferences": []}
    async with client as c:
        resp = await c.post(
            "/v1/ai/plan",
            content=_json.dumps(body).encode(),
            headers={"Content-Type": "application/json"},
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_invalid_token_returns_401(client):
    """Request with invalid token should return 401."""
    import json as _json
    body = {"prompt": "test", "destination": "Goa", "nights": 3, "budget_band": "moderate", "currency": "INR", "preferences": []}
    async with client as c:
        resp = await c.post(
            "/v1/ai/plan",
            content=_json.dumps(body).encode(),
            headers={
                "X-Service-Token": "invalid-token",
                "X-Timestamp": "1234567890000",
                "Content-Type": "application/json",
            },
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_expired_timestamp_returns_401(client):
    """Request with expired timestamp (> 5 minutes) should return 401."""
    import hashlib, hmac, json, os, time

    secret = "dev-ai-service-secret-change-in-production-32"
    body = {"prompt": "test", "destination": "Goa", "nights": 3, "budget_band": "moderate", "currency": "INR", "preferences": []}
    body_str = json.dumps(body, separators=(",", ":"), sort_keys=True)
    # Use a timestamp 10 minutes in the past
    ts = str(int((time.time() - 600) * 1000))
    body_hash = hashlib.sha256(body_str.encode()).hexdigest()
    message = f"{ts}.{body_hash}"
    token = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()

    body_bytes = json.dumps(body, separators=(",", ":")).encode()
    async with client as c:
        resp = await c.post(
            "/v1/ai/plan",
            content=body_bytes,
            headers={
                "X-Service-Token": token,
                "X-Timestamp": ts,
                "Content-Type": "application/json",
            },
        )
    assert resp.status_code == 401
