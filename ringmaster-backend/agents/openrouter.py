# agents/openrouter.py
"""
Shared OpenRouter helper — mirrors your DSA project's callLLM()
but in Python using httpx instead of axios.
"""

import httpx
from config import OPENROUTER_KEY

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL          = "openai/gpt-4o-mini"


async def call_llm(messages: list[dict], temperature: float = 0.7) -> str:
    """
    Call OpenRouter with a list of messages.
    Returns the assistant's reply as a plain string.
    """
    if not OPENROUTER_KEY:
        raise ValueError("OPENROUTER_KEY not set in .env")

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_KEY}",
                "Content-Type":  "application/json",
                "HTTP-Referer":  "http://localhost:5173",
                "X-Title":       "Ringmaster's Round Table",
            },
            json={
                "model":       MODEL,
                "messages":    messages,
                "temperature": temperature,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]