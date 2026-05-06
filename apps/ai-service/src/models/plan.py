"""Pydantic models for AI trip planner responses."""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class Place(BaseModel):
    name: str
    time: Optional[str] = None
    duration: Optional[str] = None
    cost: Optional[int] = None
    notes: Optional[str] = None
    type: Optional[str] = None  # attraction | food | transport | hotel


class DayPlan(BaseModel):
    dayNumber: int
    title: str
    places: list[Place] = Field(default_factory=list)
    totalCost: Optional[int] = None
    notes: Optional[str] = None


class AIItinerary(BaseModel):
    destination: str
    nights: int
    budgetBand: Optional[str] = None
    currency: str = "INR"
    totalEstimatedCost: Optional[int] = None
    days: list[DayPlan] = Field(default_factory=list)
    tips: Optional[list[str]] = None
    bestTimeToVisit: Optional[str] = None


class AIPlanResult(BaseModel):
    itinerary: AIItinerary
    provider: str
    cached: bool = False


class CaptionResult(BaseModel):
    caption: str
    provider: str


class HashtagsResult(BaseModel):
    hashtags: list[str]
    provider: str
