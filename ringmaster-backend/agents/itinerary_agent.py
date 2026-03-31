# agents/itinerary_agent.py  —  Itinerary Agent
import time
import json
from graph.state import TripState
from models.schemas import ItineraryData, ItineraryDay
from agents.openrouter import call_llm


async def itinerary_node(state: TripState) -> dict:
    t0 = time.perf_counter()
    try:
        result = await _fetch_from_openrouter(state)
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


async def _fetch_from_openrouter(state: TripState) -> ItineraryData:
    dest     = state["destination"]
    duration = state["duration"]
    date     = state["travel_date"]

    messages = [
        {
            "role": "system",
            "content": (
                f"You are an expert travel guide for {dest}, India. "
                "You know all real local attractions, restaurants, markets, and hidden gems. "
                "You always respond with valid JSON only — no markdown, no extra text. "
                "You never repeat the same place across multiple days."
            ),
        },
        {
            "role": "user",
            "content": f"""Create a detailed {duration}-day itinerary for {dest}, India.
Travel start date: {date}.

Rules:
- Use REAL place names specific to {dest}
- Each day must visit DIFFERENT places — no repetition
- Day 1 = arrival and orientation
- Last day = departure morning, pack up, head home
- Be specific — name exact temples, markets, restaurants, viewpoints

Return ONLY this JSON with exactly {duration} days:
{{
  "days": [
    {{
      "day": 1,
      "title": "catchy day title",
      "morning": "specific morning activity with real place name in {dest}",
      "afternoon": "specific afternoon activity with real place name in {dest}",
      "evening": "specific evening activity with real place name in {dest}",
      "tip": "one practical local insider tip"
    }}
  ]
}}""",
        },
    ]

    raw   = await call_llm(messages, temperature=0.7)
    start = raw.find("{")
    end   = raw.rfind("}") + 1
    data  = json.loads(raw[start:end])

    days = []
    for i, d in enumerate(data.get("days", [])[:duration]):
        days.append(ItineraryDay(
            day=i + 1,
            title=d.get("title", f"Day {i+1} in {dest}"),
            morning=d.get("morning", f"Morning in {dest}"),
            afternoon=d.get("afternoon", f"Afternoon in {dest}"),
            evening=d.get("evening", f"Evening in {dest}"),
            tip=d.get("tip", "Ask locals for the best hidden spots."),
        ))

    # Fill any missing days
    while len(days) < duration:
        n = len(days) + 1
        days.append(ItineraryDay(
            day=n, title=f"Day {n} — Free exploration",
            morning="Revisit your favourite spot.",
            afternoon="Browse local markets and pick up souvenirs.",
            evening="Farewell dinner at the best restaurant you discovered.",
            tip="The best moments are always the unplanned ones.",
        ))

    return ItineraryData(days=days, source="GPT-4o mini via OpenRouter")


def _mock_itinerary(destination: str, duration: int) -> ItineraryData:
    days = []
    for i in range(duration):
        days.append(ItineraryDay(
            day=i + 1,
            title=f"Day {i+1} in {destination}",
            morning=f"Morning exploration of {destination}.",
            afternoon="Visit local market and have lunch.",
            evening="Evening stroll and local dinner.",
            tip="Ask locals for hidden gems.",
        ))
    return ItineraryData(days=days, source="Mock (OpenRouter unavailable)")