"""AI trip planner endpoints."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, AsyncIterator, Dict, Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from jinja2 import Environment, FileSystemLoader
from pydantic import BaseModel

from ..ai.client import generate_with_fallback, get_ai_client
from ..config import settings
from ..middleware.hmac import verify_service_token
from ..models.plan import AIItinerary, AIPlanResult

router = APIRouter(prefix="/v1/ai", tags=["ai"])
logger = structlog.get_logger(__name__)

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"
jinja_env = Environment(loader=FileSystemLoader(str(PROMPTS_DIR)), autoescape=False)


class PlanRequest(BaseModel):
    prompt: str = ""
    destination: Optional[str] = None
    nights: Optional[int] = 3
    budget_band: Optional[str] = "moderate"
    currency: str = "INR"
    preferences: Optional[list[str]] = None


class RefinePlanRequest(BaseModel):
    previous_plan: Dict[str, Any]
    user_message: str
    context: Optional[Dict[str, Any]] = None


class OptimizeBudgetRequest(BaseModel):
    itinerary: Dict[str, Any]
    new_budget: float
    currency: str = "INR"


def _render_prompt(template_name: str, **kwargs: Any) -> str:
    template = jinja_env.get_template(template_name)
    return template.render(**kwargs)


def _parse_itinerary(raw: str, destination: str, nights: int, budget_band: str) -> AIItinerary:
    """Parse LLM JSON output into AIItinerary, with fallback."""
    # Strip markdown code fences if present
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON from the response
        import re
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            data = json.loads(match.group())
        else:
            raise HTTPException(status_code=502, detail="AI returned invalid JSON")

    # Ensure required fields are present
    if "days" not in data:
        data["days"] = []
    if "destination" not in data:
        data["destination"] = destination
    if "nights" not in data:
        data["nights"] = nights
    if "budgetBand" not in data:
        data["budgetBand"] = budget_band

    return AIItinerary(**data)


@router.post("/plan", dependencies=[Depends(verify_service_token)])
async def generate_plan(body: PlanRequest) -> dict:
    destination = body.destination or "Unknown Destination"
    nights = body.nights or 3
    budget_band = body.budget_band or "moderate"

    prompt = _render_prompt(
        "plan.jinja2",
        destination=destination,
        nights=nights,
        budget_band=budget_band,
        currency=body.currency,
        preferences=body.preferences or [],
        prompt=body.prompt,
    )

    logger.info("Generating AI plan", destination=destination, nights=nights)

    raw = await generate_with_fallback(prompt, schema={"type": "object"})
    itinerary = _parse_itinerary(raw, destination, nights, budget_band)

    # Detect which provider was used
    provider = settings.ai_provider

    return AIPlanResult(itinerary=itinerary, provider=provider).model_dump()


@router.post("/plan/refine", dependencies=[Depends(verify_service_token)])
async def refine_plan(body: RefinePlanRequest) -> StreamingResponse:
    prompt = _render_prompt(
        "refine.jinja2",
        previous_plan=body.previous_plan,
        user_message=body.user_message,
        context=body.context,
    )

    logger.info("Refining AI plan", user_message=body.user_message[:100])

    async def _stream_tokens() -> AsyncIterator[str]:
        raw = await generate_with_fallback(prompt, schema={"type": "object"})
        # Yield chunks simulating SSE stream
        # For true streaming we'd use the provider's streaming API,
        # but for now we send the full result as one SSE event
        data = raw.replace("\n", " ")
        yield f"data: {data}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        _stream_tokens(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/optimize-budget", dependencies=[Depends(verify_service_token)])
async def optimize_budget(body: OptimizeBudgetRequest) -> dict:
    destination = body.itinerary.get("destination", "the destination")
    nights = body.itinerary.get("nights", 3)

    optimize_prompt = (
        f"The following travel itinerary has a budget that needs to be reduced to {body.new_budget} {body.currency}. "
        f"Modify accommodation to budget options, replace restaurants with street food, "
        f"prioritize free attractions. Keep the same destinations and number of days.\n\n"
        f"Current itinerary:\n{json.dumps(body.itinerary, indent=2)}\n\n"
        f"Return the complete modified itinerary as valid JSON with the same structure."
    )

    raw = await generate_with_fallback(optimize_prompt, schema={"type": "object"})
    itinerary = _parse_itinerary(raw, destination, nights, "budget")

    return AIPlanResult(itinerary=itinerary, provider=settings.ai_provider).model_dump()
