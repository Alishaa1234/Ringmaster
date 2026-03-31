# graph/trip_graph.py
import time
import asyncio
from langgraph.graph import StateGraph, END

from graph.state import TripState
from agents.weather_agent   import weather_node
from agents.route_agent     import route_node
from agents.budget_agent    import budget_node
from agents.itinerary_agent import itinerary_node
from agents.events_agent    import events_node


async def orchestrator_node(state: TripState) -> dict:
    """Runs all 5 agents in parallel using asyncio.gather."""
    results = await asyncio.gather(
        weather_node(state),
        route_node(state),
        budget_node(state),
        itinerary_node(state),
        events_node(state),
    )

    merged = {
        "meta":   {"start_ms": int(time.time() * 1000)},
        "errors": [],
    }
    for result in results:
        merged.update(result)

    return merged


async def aggregator_node(state: TripState) -> dict:
    """Builds the summary and stamps total elapsed time."""
    dest     = state.get("destination", "your destination")
    duration = state.get("duration", 7)
    weather  = state.get("weather")
    budget   = state.get("budget")
    events   = state.get("events")

    parts = [f"A {duration}-day adventure awaits in {dest}."]
    if weather:
        parts.append(f"Expect {weather.condition.lower()} skies around {weather.temp_high}°C.")
    if budget:
        parts.append(f"Budget ranges from ₹{budget.total_estimate.low:,} to ₹{budget.total_estimate.high:,}.")
    if events and events.festivals:
        parts.append(f"Catch {events.festivals[0].name} during your visit.")

    start   = state.get("meta", {}).get("start_ms", int(time.time() * 1000))
    elapsed = int(time.time() * 1000) - start

    return {
        "summary": " ".join(parts),
        "meta": {**state.get("meta", {}), "total_ms": elapsed},
    }


def build_trip_graph():
    graph = StateGraph(TripState)

    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("aggregator",   aggregator_node)

    graph.set_entry_point("orchestrator")
    graph.add_edge("orchestrator", "aggregator")
    graph.add_edge("aggregator",   END)

    return graph.compile()


trip_graph = build_trip_graph()