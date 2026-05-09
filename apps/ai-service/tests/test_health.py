"""Tests for the health endpoint."""
import pytest


@pytest.mark.asyncio
async def test_health_ok(client):
    """GET /health returns status ok."""
    async with client as c:
        resp = await c.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "ai-service"


@pytest.mark.asyncio
async def test_health_includes_provider(client):
    """GET /health returns provider and mock_mode."""
    async with client as c:
        resp = await c.get("/health")
    data = resp.json()
    assert "provider" in data
    assert "mock_mode" in data


@pytest.mark.asyncio
async def test_health_mock_mode_when_mock_provider(client):
    """mock_mode is True when AI_PROVIDER=mock."""
    async with client as c:
        resp = await c.get("/health")
    data = resp.json()
    # In test env, AI_PROVIDER=mock so mock_mode should be True
    assert data["provider"] == "mock"
    assert data["mock_mode"] is True
