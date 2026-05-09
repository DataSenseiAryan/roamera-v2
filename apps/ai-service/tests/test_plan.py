"""Tests for the /v1/ai/plan endpoint."""
import pytest
from .conftest import make_hmac_headers


PLAN_BODY = {
    "prompt": "Plan a trip to Goa",
    "destination": "Goa",
    "nights": 3,
    "budget_band": "moderate",
    "currency": "INR",
    "preferences": ["beaches", "seafood"],
}


@pytest.mark.asyncio
async def test_plan_with_valid_hmac_returns_200(client):
    """POST /v1/ai/plan with valid HMAC + mock provider → 200 with itinerary."""
    headers, body_bytes = make_hmac_headers(PLAN_BODY)
    async with client as c:
        resp = await c.post("/v1/ai/plan", content=body_bytes, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "itinerary" in data
    assert "provider" in data


@pytest.mark.asyncio
async def test_plan_itinerary_has_days_array(client):
    """Plan response itinerary should contain a days array."""
    headers, body_bytes = make_hmac_headers(PLAN_BODY)
    async with client as c:
        resp = await c.post("/v1/ai/plan", content=body_bytes, headers=headers)
    assert resp.status_code == 200
    itinerary = resp.json()["itinerary"]
    assert isinstance(itinerary["days"], list)
    assert len(itinerary["days"]) > 0


@pytest.mark.asyncio
async def test_plan_itinerary_has_correct_structure(client):
    """Each day in the itinerary should have dayNumber and places."""
    headers, body_bytes = make_hmac_headers(PLAN_BODY)
    async with client as c:
        resp = await c.post("/v1/ai/plan", content=body_bytes, headers=headers)
    assert resp.status_code == 200
    days = resp.json()["itinerary"]["days"]
    for day in days:
        assert "dayNumber" in day
        assert "places" in day
        assert isinstance(day["places"], list)


@pytest.mark.asyncio
async def test_plan_uses_mock_provider(client):
    """With AI_PROVIDER=mock, provider field should indicate mock."""
    headers, body_bytes = make_hmac_headers(PLAN_BODY)
    async with client as c:
        resp = await c.post("/v1/ai/plan", content=body_bytes, headers=headers)
    data = resp.json()
    assert data["provider"] == "mock"
