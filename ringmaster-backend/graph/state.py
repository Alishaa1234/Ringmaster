# graph/state.py
from typing import Optional, TypedDict
from models.schemas import (
    WeatherData,
    RouteData,
    BudgetData,
    ItineraryData,
    EventsData,
)


class TripState(TypedDict):
    # ── Input ──────────────────────────────────────────────────────────────
    destination: str
    origin:      str
    travel_date: str
    duration:    int

    # ── Agent outputs ───────────────────────────────────────────────────────
    weather:   Optional[WeatherData]
    route:     Optional[RouteData]
    budget:    Optional[BudgetData]
    itinerary: Optional[ItineraryData]
    events:    Optional[EventsData]
    summary:   Optional[str]

    # ── Meta ────────────────────────────────────────────────────────────────
    meta:   dict
    errors: list[str]