"""Tests for the /v1/ai/caption endpoint."""
import pytest
from .conftest import make_hmac_headers


CAPTION_BODY = {
    "image_url": "https://example.com/photo.jpg",
    "context": {"description": "Sunset at a beach in Goa", "style": "casual"},
}


@pytest.mark.asyncio
async def test_caption_with_valid_hmac_returns_200(client):
    """POST /v1/ai/caption with valid HMAC + mock provider → 200."""
    headers, body_bytes = make_hmac_headers(CAPTION_BODY)
    async with client as c:
        resp = await c.post("/v1/ai/caption", content=body_bytes, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "caption" in data


@pytest.mark.asyncio
async def test_caption_returns_string(client):
    """Caption should be a non-empty string."""
    headers, body_bytes = make_hmac_headers(CAPTION_BODY)
    async with client as c:
        resp = await c.post("/v1/ai/caption", content=body_bytes, headers=headers)
    assert resp.status_code == 200
    caption = resp.json()["caption"]
    assert isinstance(caption, str)
    assert len(caption) > 0


@pytest.mark.asyncio
async def test_caption_without_auth_returns_401(client):
    """Caption without HMAC headers → 401."""
    import json as _json
    async with client as c:
        resp = await c.post(
            "/v1/ai/caption",
            content=_json.dumps(CAPTION_BODY).encode(),
            headers={"Content-Type": "application/json"},
        )
    assert resp.status_code == 401
