# routers/trip.py
"""
Trip Router — POST /api/trip
Validates the request, invokes the LangGraph, returns TripResponse.
"""

from fastapi import APIRouter, HTTPException
from models.schemas import TripRequest, TripResponse
from graph.trip_graph import trip_graph

router = APIRouter(prefix="/api", tags=["trip"])


@router.post(
    "/trip",
    response_model=TripResponse,
    summary="Plan a full trip",
    description=(
        "Runs the LangGraph multi-agent pipeline: "
        "Sky Gazer (weather), Trailblazer (route), "
        "Quartermaster (budget), and Itinerary Agent — in parallel."
    ),
)
async def plan_trip(req: TripRequest):
    # Build the initial state from the request
    initial_state = {
        "destination": req.destination,
        "origin":      req.origin,
        "travel_date": req.travel_date,
        "duration":    req.duration,
        "weather":     None,
        "route":       None,
        "budget":      None,
        "itinerary":   None,
        "summary":     None,
        "meta":        {},
        "errors":      [],
    }

    try:
        final_state = await trip_graph.ainvoke(initial_state)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Graph execution failed: {exc}")

    return TripResponse(
        destination=final_state["destination"],
        origin=final_state["origin"],
        travel_date=final_state["travel_date"],
        duration=final_state["duration"],
        summary=final_state.get("summary"),
        weather=final_state.get("weather"),
        route=final_state.get("route"),
        budget=final_state.get("budget"),
        itinerary=final_state.get("itinerary"),
        meta=final_state.get("meta", {}),
    )


@router.get("/health", summary="Health check")
async def health():
    return {"status": "ok", "service": "Ringmaster's Round Table API (LangGraph)"}