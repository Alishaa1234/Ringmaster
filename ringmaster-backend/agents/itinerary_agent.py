# agents/itinerary_agent.py  —  Itinerary Agent
"""
LangGraph node: calls Claude API to generate a day-by-day itinerary,
writes itinerary key back. Falls back to mock if no API key.
"""

import time
import json
from graph.state import TripState
from models.schemas import ItineraryData, ItineraryDay
from config import ANTHROPIC_API_KEY


async def itinerary_node(state: TripState) -> dict:
    """LangGraph node — returns a partial state update dict."""
    t0 = time.perf_counter()

    try:
        if ANTHROPIC_API_KEY:
            result = await _fetch_from_claude(state)
        else:
            result = _mock_itinerary(state["destination"], state["duration"])

        elapsed = round((time.perf_counter() - t0) * 1000)
        return {
            "itinerary": result,
            "meta": {**state.get("meta", {}), "itinerary_ms": elapsed},
        }

    except Exception as exc:
        return {
            "itinerary": _mock_itinerary(state["destination"], state["duration"]),
            "errors": state.get("errors", []) + [f"itinerary: {exc}"],
        }


async def _fetch_from_claude(state: TripState) -> ItineraryData:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

    prompt = f"""You are a seasoned India travel guide. Create a vivid, practical {state["duration"]}-day itinerary for {state["destination"]}.

Return ONLY valid JSON, no markdown:
{{
  "days": [
    {{
      "day": 1,
      "title": "<evocative day title>",
      "morning": "<specific morning activity>",
      "afternoon": "<specific afternoon activity>",
      "evening": "<specific evening activity>",
      "tip": "<one hyper-local insider tip>"
    }}
  ]
}}

Be specific — name actual places, markets, dishes, streets. Travel date: {state["travel_date"]}."""

    msg = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = msg.content[0].text.replace("```json", "").replace("```", "").strip()
    data = json.loads(raw)
    return ItineraryData(
        days=[ItineraryDay(**d) for d in data["days"]],
        source="Claude AI (live)",
    )


def _mock_itinerary(destination: str, duration: int) -> ItineraryData:
    templates = [
        ("Arrival & First Impressions",
         "Land and check in. Explore the neighbourhood on foot.",
         "Visit the main market — grab local street food for lunch.",
         "Sunset stroll + dinner at a well-reviewed local restaurant.",
         "Ask your hotel for a scooter rental recommendation — cheapest and most fun way around."),
        ("Heritage & Culture",
         "Visit the top UNESCO or heritage site — arrive early to beat crowds.",
         "Local history museum or cultural centre.",
         "Traditional performance or live music venue.",
         "Mondays often have free entry at government-run museums."),
        ("Nature & Adventure",
         "Early morning nature trek or boat trip — wildlife most active at dawn.",
         "Waterfall, viewpoint, or beach depending on terrain.",
         "Spa or Ayurvedic massage — well-earned after the trek.",
         "Book adventure activities the day before — popular slots sell out."),
        ("Local Life",
         "Morning at the local weekly market — freshest produce and best prices.",
         "Cooking class or food tour — learn 2–3 signature dishes.",
         "Rooftop dinner with city/sea views.",
         "The best local food is almost always in lanes behind the main tourist street."),
        ("Day Trip",
         "Full-day excursion to a nearby village or natural attraction.",
         "Picnic lunch at the destination.",
         "Return by sunset — evening at leisure.",
         "Hire a local guide for day trips — they know shortcuts and secret spots."),
        ("Free & Flexible",
         "Sleep in. Lazy breakfast at a café.",
         "Shopping — local handicrafts, spices, and textiles.",
         "Farewell dinner at your favourite restaurant from the trip.",
         "Bargain firmly at souvenir shops — opening price is usually 2–3x the fair price."),
        ("Departure",
         "Last sunrise walk. Soak in the atmosphere one final time.",
         "Pack up. Quick visit to a spot you missed.",
         "Head to airport or station. Grab local snacks for the journey.",
         "Arrive 2 hours early for flights from smaller airports — security queues can surprise."),
    ]

    days = []
    for i in range(min(duration, len(templates))):
        t = templates[i]
        days.append(ItineraryDay(
            day=i+1, title=t[0],
            morning=t[1], afternoon=t[2], evening=t[3], tip=t[4],
        ))

    while len(days) < duration:
        days.append(ItineraryDay(
            day=len(days)+1, title="Explore at Leisure",
            morning="Follow your instincts — revisit a favourite spot.",
            afternoon="Wander without a plan — the best discoveries are unplanned.",
            evening="Reflect on the trip over a long dinner.",
            tip="The best travel days are often the unscheduled ones.",
        ))

    return ItineraryData(days=days, source="Mock (no API key)")