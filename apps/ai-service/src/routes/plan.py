"""AI trip planner endpoints — implemented in Sprint 3."""
from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..middleware.hmac import verify_service_token

router = APIRouter(prefix="/v1/ai", tags=["ai"])


class PlanRequest(BaseModel):
    prompt: str
    destination: Optional[str] = None
    nights: Optional[int] = None
    budget_band: Optional[str] = None
    preferences: Optional[Dict] = None


class RefinePlanRequest(BaseModel):
    previous_plan: Dict
    user_message: str
    context: Optional[Dict] = None


class OptimizeBudgetRequest(BaseModel):
    itinerary: Dict
    new_budget: float
    currency: str = "INR"


@router.post("/plan", dependencies=[Depends(verify_service_token)])
async def generate_plan(body: PlanRequest) -> dict:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="AI plan endpoint not yet implemented — see Sprint 3.",
    )


@router.post("/plan/refine", dependencies=[Depends(verify_service_token)])
async def refine_plan(body: RefinePlanRequest) -> dict:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="AI refine endpoint not yet implemented — see Sprint 3.",
    )


@router.post("/optimize-budget", dependencies=[Depends(verify_service_token)])
async def optimize_budget(body: OptimizeBudgetRequest) -> dict:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="AI optimize-budget endpoint not yet implemented — see Sprint 3.",
    )
