"""Provider-agnostic AI client abstraction."""
from __future__ import annotations

import json
import logging
from typing import Any, Optional, Protocol, runtime_checkable

import structlog

from ..config import settings

logger = structlog.get_logger(__name__)


@runtime_checkable
class AIClient(Protocol):
    async def generate(self, prompt: str, schema: dict[str, Any] | None = None) -> str: ...
    async def generate_with_image(self, prompt: str, image_url: str) -> str: ...


# ─── Gemini ──────────────────────────────────────────────────────────────────

class GeminiClient:
    MODEL = "gemini-2.0-flash"

    def __init__(self) -> None:
        import google.generativeai as genai  # type: ignore[import]
        genai.configure(api_key=settings.google_api_key)
        self._genai = genai
        self._model = genai.GenerativeModel(self.MODEL)

    async def generate(self, prompt: str, schema: dict[str, Any] | None = None) -> str:
        config = {}
        if schema:
            config["response_mime_type"] = "application/json"
        response = await self._model.generate_content_async(prompt, generation_config=config)
        return response.text

    async def generate_with_image(self, prompt: str, image_url: str) -> str:
        import httpx
        async with httpx.AsyncClient() as client:
            img_resp = await client.get(image_url)
            img_resp.raise_for_status()
            image_part = {
                "mime_type": img_resp.headers.get("content-type", "image/jpeg"),
                "data": img_resp.content,
            }
        response = await self._model.generate_content_async([prompt, image_part])
        return response.text


# ─── Groq ────────────────────────────────────────────────────────────────────

class GroqClient:
    MODEL = "llama-3.3-70b-versatile"

    def __init__(self) -> None:
        from groq import AsyncGroq  # type: ignore[import]
        self._client = AsyncGroq(api_key=settings.groq_api_key)

    async def generate(self, prompt: str, schema: dict[str, Any] | None = None) -> str:
        response_format = {"type": "json_object"} if schema else None
        kwargs: dict[str, Any] = {
            "model": self.MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 4096,
        }
        if response_format:
            kwargs["response_format"] = response_format
        completion = await self._client.chat.completions.create(**kwargs)
        return completion.choices[0].message.content or ""

    async def generate_with_image(self, prompt: str, image_url: str) -> str:
        completion = await self._client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                }
            ],
            max_tokens=1024,
        )
        return completion.choices[0].message.content or ""


# ─── OpenAI ──────────────────────────────────────────────────────────────────

class OpenAIClient:
    MODEL = "gpt-4o-mini"

    def __init__(self) -> None:
        from openai import AsyncOpenAI  # type: ignore[import]
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def generate(self, prompt: str, schema: dict[str, Any] | None = None) -> str:
        kwargs: dict[str, Any] = {
            "model": self.MODEL,
            "messages": [{"role": "user", "content": prompt}],
        }
        if schema:
            kwargs["response_format"] = {"type": "json_object"}
        completion = await self._client.chat.completions.create(**kwargs)
        return completion.choices[0].message.content or ""

    async def generate_with_image(self, prompt: str, image_url: str) -> str:
        completion = await self._client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                }
            ],
        )
        return completion.choices[0].message.content or ""


# ─── Anthropic ───────────────────────────────────────────────────────────────

class AnthropicClient:
    MODEL = "claude-3-5-haiku-20241022"

    def __init__(self) -> None:
        import anthropic  # type: ignore[import]
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def generate(self, prompt: str, schema: dict[str, Any] | None = None) -> str:
        system = "You are a helpful travel planning assistant. Always respond in valid JSON when a schema is provided."
        message = await self._client.messages.create(
            model=self.MODEL,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text  # type: ignore[union-attr]

    async def generate_with_image(self, prompt: str, image_url: str) -> str:
        import httpx
        async with httpx.AsyncClient() as client:
            img_resp = await client.get(image_url)
            img_resp.raise_for_status()
            import base64
            img_b64 = base64.standard_b64encode(img_resp.content).decode()
            media_type = img_resp.headers.get("content-type", "image/jpeg")
        message = await self._client.messages.create(
            model=self.MODEL,
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {"type": "base64", "media_type": media_type, "data": img_b64},
                        },
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
        )
        return message.content[0].text  # type: ignore[union-attr]


# ─── Factory ─────────────────────────────────────────────────────────────────

_CLIENTS: dict[str, type] = {
    "gemini": GeminiClient,
    "groq": GroqClient,
    "openai": OpenAIClient,
    "anthropic": AnthropicClient,
}


def get_ai_client(provider: str | None = None) -> AIClient:
    name = provider or settings.ai_provider
    cls = _CLIENTS.get(name)
    if not cls:
        raise ValueError(f"Unknown AI provider: {name!r}. Valid: {list(_CLIENTS)}")
    return cls()  # type: ignore[return-value]


async def generate_with_fallback(
    prompt: str,
    schema: dict[str, Any] | None = None,
    image_url: str | None = None,
) -> str:
    """Try primary provider, fall back on error."""
    providers = [settings.ai_provider, settings.ai_fallback_provider]
    last_error: Exception | None = None

    for provider_name in providers:
        try:
            client = get_ai_client(provider_name)
            if image_url:
                return await client.generate_with_image(prompt, image_url)
            return await client.generate(prompt, schema)
        except Exception as exc:
            logger.warning("AI provider failed", provider=provider_name, error=str(exc))
            last_error = exc

    raise RuntimeError(f"All AI providers failed. Last error: {last_error}")
