# routers/trip.py
import asyncio
from fastapi import APIRouter, HTTPException
from models.schemas import TripRequest, TripResponse, CompareRequest, CompareResponse
from graph.trip_graph import trip_graph
from agents.openrouter import call_llm

router = APIRouter(prefix="/api", tags=["trip"])


def _build_state(destination: str, origin: str, travel_date: str, duration: int) -> dict:
    return {
        "destination": destination,
        "origin":      origin,
        "travel_date": travel_date,
        "duration":    duration,
        "weather":     None,
        "route":       None,
        "budget":      None,
        "itinerary":   None,
        "events":      None,
        "summary":     None,
        "meta":        {},
        "errors":      [],
    }


def _state_to_response(s: dict) -> TripResponse:
    return TripResponse(
        destination=s["destination"],
        origin=s["origin"],
        travel_date=s["travel_date"],
        duration=s["duration"],
        summary=s.get("summary"),
        weather=s.get("weather"),
        route=s.get("route"),
        budget=s.get("budget"),
        itinerary=s.get("itinerary"),
        events=s.get("events"),
        meta=s.get("meta", {}),
    )


async def _generate_verdict(a: TripResponse, b: TripResponse, duration: int) -> str:
    """Calls OpenRouter to generate a rich AI verdict comparing both destinations."""
    try:
        a_budget = a.budget.total_estimate.mid if a.budget else "unknown"
        b_budget = b.budget.total_estimate.mid if b.budget else "unknown"
        a_weather = f"{a.weather.condition}, {a.weather.temp_high}°C" if a.weather else "unknown"
        b_weather = f"{b.weather.condition}, {b.weather.temp_high}°C" if b.weather else "unknown"
        a_dist = a.route.distance_km if a.route else "unknown"
        b_dist = b.route.distance_km if b.route else "unknown"
        a_events = ", ".join(e.name for e in a.events.festivals[:2]) if a.events else "unknown"
        b_events = ", ".join(e.name for e in b.events.festivals[:2]) if b.events else "unknown"

        messages = [
            {
                "role": "system",
                "content": "You are an expert Indian travel advisor. Give honest, specific, opinionated travel advice. Be direct and helpful.",
            },
            {
                "role": "user",
                "content": f"""Compare these two Indian destinations for a {duration}-day trip:

{a.destination}:
- Budget (mid): ₹{a_budget}
- Weather: {a_weather}, Humidity: {a.weather.humidity if a.weather else 'unknown'}%
- Distance from {a.origin}: {a_dist} km
- Festivals: {a_events}

{b.destination}:
- Budget (mid): ₹{b_budget}
- Weather: {b_weather}, Humidity: {b.weather.humidity if b.weather else 'unknown'}%
- Distance from {b.origin}: {b_dist} km
- Festivals: {b_events}

Write a honest 3-paragraph verdict:
1. Which is better overall and why (be specific and opinionated)
2. Who should pick {a.destination} (type of traveller, what they value)
3. Who should pick {b.destination} (type of traveller, what they value)

Be specific, practical, and direct. No generic advice.""",
            },
        ]
        return await call_llm(messages, temperature=0.7)
    except Exception:
        return f"Both {a.destination} and {b.destination} offer unique experiences. Your choice depends on your travel style and priorities."


@router.post("/trip", response_model=TripResponse, summary="Plan a full trip")
async def plan_trip(req: TripRequest):
    try:
        final_state = await trip_graph.ainvoke(
            _build_state(req.destination, req.origin, req.travel_date, req.duration)
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Graph execution failed: {exc}")
    return _state_to_response(final_state)


@router.post("/compare", response_model=CompareResponse, summary="Compare two destinations")
async def compare_trips(req: CompareRequest):
    state_a = _build_state(req.destination_a, req.origin, req.travel_date, req.duration)
    state_b = _build_state(req.destination_b, req.origin, req.travel_date, req.duration)

    try:
        result_a, result_b = await asyncio.gather(
            trip_graph.ainvoke(state_a),
            trip_graph.ainvoke(state_b),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {exc}")

    resp_a = _state_to_response(result_a)
    resp_b = _state_to_response(result_b)

    # Generate AI verdict after both plans are ready
    verdict = await _generate_verdict(resp_a, resp_b, req.duration)

    return CompareResponse(
        destination_a=resp_a,
        destination_b=resp_b,
        verdict=verdict,
    )


@router.get("/health", summary="Health check")
async def health():
    return {"status": "ok", "service": "Ringmaster's Round Table API (LangGraph)"}