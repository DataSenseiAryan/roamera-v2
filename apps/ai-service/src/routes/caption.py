"""AI caption and hashtag generation endpoints."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException
from jinja2 import Environment, FileSystemLoader
from pydantic import BaseModel

from ..ai.client import generate_with_fallback
from ..config import settings
from ..middleware.hmac import verify_service_token
from ..models.plan import CaptionResult, HashtagsResult

router = APIRouter(prefix="/v1/ai", tags=["ai"])
logger = structlog.get_logger(__name__)

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"
jinja_env = Environment(loader=FileSystemLoader(str(PROMPTS_DIR)), autoescape=False)


class CaptionRequest(BaseModel):
    image_url: str
    context: Optional[Dict[str, Any]] = None


class HashtagsRequest(BaseModel):
    post_content: str
    destination: Optional[str] = None
    vacation_type: Optional[str] = None


class TranslateRequest(BaseModel):
    text: str
    target_locale: str


@router.post("/caption", dependencies=[Depends(verify_service_token)])
async def generate_caption(body: CaptionRequest) -> dict:
    prompt_template = jinja_env.get_template("caption.jinja2")
    prompt = prompt_template.render(context=body.context)

    logger.info("Generating caption for image", image_url=body.image_url[:80])

    try:
        caption = await generate_with_fallback(prompt, image_url=body.image_url)
        # Clean up any stray quotes
        caption = caption.strip().strip('"').strip("'")
    except Exception as exc:
        logger.error("Caption generation failed", error=str(exc))
        raise HTTPException(status_code=502, detail=f"AI provider error: {exc}") from exc

    return CaptionResult(caption=caption, provider=settings.ai_provider).model_dump()


@router.post("/hashtags", dependencies=[Depends(verify_service_token)])
async def generate_hashtags(body: HashtagsRequest) -> dict:
    prompt_template = jinja_env.get_template("hashtags.jinja2")
    prompt = prompt_template.render(
        post_content=body.post_content,
        destination=body.destination,
        vacation_type=body.vacation_type,
    )

    logger.info("Generating hashtags", destination=body.destination)

    raw = await generate_with_fallback(prompt)

    # Parse hashtag array from response
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        hashtags = json.loads(text)
        if not isinstance(hashtags, list):
            raise ValueError("Not a list")
    except (json.JSONDecodeError, ValueError):
        # Fall back to extracting words that look like hashtags
        words = re.findall(r'[\w]+', text)
        hashtags = [w.lower() for w in words if len(w) > 2][:15]

    # Ensure "roamera" is always present
    if "roamera" not in hashtags:
        hashtags.append("roamera")

    return HashtagsResult(hashtags=hashtags, provider=settings.ai_provider).model_dump()


@router.post("/translate", dependencies=[Depends(verify_service_token)])
async def translate_text(body: TranslateRequest) -> dict:
    raise HTTPException(
        status_code=501,
        detail="Translation endpoint deferred to Sprint 10.",
    )
