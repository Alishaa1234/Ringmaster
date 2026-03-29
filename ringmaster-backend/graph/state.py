# graph/state.py
"""
TripState is the single shared object that flows through every node
in the LangGraph StateGraph. Each agent reads what it needs and writes
its own output key — no agent ever overwrites another's result.
"""

from typing import Optional, TypedDict
from models.schemas import (
    WeatherData,
    RouteData,
    BudgetData,
    ItineraryData,
)


class TripState(TypedDict):
    # ── Input (set once by the router, never mutated) ──────────────────────
    destination: str
    origin:      str
    travel_date: str
    duration:    int

    # ── Agent outputs (each agent sets exactly one key) ────────────────────
    weather:   Optional[WeatherData]
    route:     Optional[RouteData]
    budget:    Optional[BudgetData]
    itinerary: Optional[ItineraryData]
    summary:   Optional[str]

    # ── Metadata (timings, errors) ─────────────────────────────────────────
    meta: dict
    errors: list[str]