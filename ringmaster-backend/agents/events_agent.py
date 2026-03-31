# agents/events_agent.py  —  Events Agent
import time
import json
from graph.state import TripState
from models.schemas import EventsData, EventItem
from agents.openrouter import call_llm


async def events_node(state: TripState) -> dict:
    t0 = time.perf_counter()
    try:
        result = await _fetch_from_openrouter(state)
        elapsed = round((time.perf_counter() - t0) * 1000)
        return {
            "events": result,
            "meta": {**state.get("meta", {}), "events_ms": elapsed},
        }
    except Exception as exc:
        return {
            "events": _mock_events(state["destination"]),
            "errors": state.get("errors", []) + [f"events: {exc}"],
        }


async def _fetch_from_openrouter(state: TripState) -> EventsData:
    dest = state["destination"]
    date = state["travel_date"]

    messages = [
        {
            "role": "system",
            "content": (
                f"You are a local expert on {dest}, India. "
                "You know all real festivals, attractions, hidden gems, and local food. "
                "You always respond with valid JSON only — no markdown, no extra text."
            ),
        },
        {
            "role": "user",
            "content": f"""For a trip to {dest}, India around {date}, provide local events and experiences.

Return ONLY this JSON:
{{
  "festivals": [
    {{"name": "real festival name", "date": "approximate month/date", "description": "what it involves"}}
  ],
  "things_to_do": [
    {{"name": "specific activity or place", "category": "Culture/Nature/Food/Adventure/Spiritual", "description": "why visit and what to expect"}}
  ],
  "hidden_gems": [
    {{"name": "lesser known place or experience", "description": "why it is special and how to get there"}}
  ],
  "food": [
    {{"name": "specific dish or restaurant name", "description": "what makes it special and where to find it"}}
  ],
  "insider_tip": "one very specific insider tip only locals know about {dest}"
}}

Be specific to {dest} — use real place names, real festivals, real dishes and restaurants.""",
        },
    ]

    raw   = await call_llm(messages, temperature=0.7)
    start = raw.find("{")
    end   = raw.rfind("}") + 1
    data  = json.loads(raw[start:end])

    return EventsData(
        festivals=[EventItem(**f) for f in data.get("festivals", [])],
        things_to_do=[EventItem(**t) for t in data.get("things_to_do", [])],
        hidden_gems=[EventItem(**g) for g in data.get("hidden_gems", [])],
        food=[EventItem(**f) for f in data.get("food", [])],
        insider_tip=data.get("insider_tip", ""),
        source="GPT-4o mini via OpenRouter",
    )


def _mock_events(destination: str) -> EventsData:
    return EventsData(
        festivals=[
            EventItem(name="Local festival", date="Check local calendar",
                      description=f"Seasonal festival in {destination} — check dates closer to travel."),
        ],
        things_to_do=[
            EventItem(name="Explore the old town", category="Culture",
                      description="Walk through historic streets and soak in local architecture."),
        ],
        hidden_gems=[
            EventItem(name="Local neighbourhood café",
                      description="Ask locals for their favourite breakfast spot."),
        ],
        food=[
            EventItem(name="Local street food",
                      description=f"Try the signature street food of {destination}."),
        ],
        insider_tip=f"Set OPENROUTER_KEY in .env to get real AI results for {destination}.",
        source="Mock (OpenRouter unavailable)",
    )