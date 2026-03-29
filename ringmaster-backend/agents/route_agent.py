# agents/route_agent.py  —  Trailblazer
"""
LangGraph node: reads origin/destination from state,
writes route key back. Real API (OpenRouteService) wired in Phase 2.
"""

import time
from graph.state import TripState
from models.schemas import RouteData, TransportOption


ROUTE_MOCK_DB = {
    "goa":         {"distance_km": 597, "scenic": "The Konkan Railway hugs the Western Ghats coast through 91 tunnels and over 2,000 bridges — one of India's most scenic rail routes."},
    "shimla":      {"distance_km": 1480, "scenic": "The Kalka–Shimla narrow-gauge railway is a UNESCO World Heritage route winding through 102 tunnels and 800+ bridges."},
    "pondicherry": {"distance_km": 1670, "scenic": "The coastal highway along the Coromandel Coast offers stunning Bay of Bengal views — stop at Mahabalipuram en route."},
    "manali":      {"distance_km": 1510, "scenic": "The Atal Tunnel (world's longest highway tunnel at 9.2km) makes year-round access possible. Stunning mountain passes beyond."},
    "jaipur":      {"distance_km": 1185, "scenic": "NH 48 passes through the rugged Aravalli hills — the pink city skyline appears dramatically as you approach from the west."},
}

def _get_mock_route(destination: str) -> dict:
    key = destination.lower().strip()
    return ROUTE_MOCK_DB.get(key, {
        "distance_km": 800,
        "scenic": f"A scenic journey from Mumbai to {destination} — varied landscapes and local culture await along the route.",
    })


async def route_node(state: TripState) -> dict:
    """LangGraph node — returns a partial state update dict."""
    t0 = time.perf_counter()

    try:
        mock = _get_mock_route(state["destination"])
        dist = mock["distance_km"]

        options = [
            TransportOption(
                mode="Flight",
                duration=f"{max(1, dist // 600)}h {(dist % 600) // 10}m",
                cost=f"₹{3500 + dist * 6:,}–₹{8000 + dist * 10:,}",
                comfort=5,
                recommended=dist > 700,
            ),
            TransportOption(
                mode="Train (Express)",
                duration=f"{dist // 80}h",
                cost=f"₹{600 + dist // 3:,}–₹{2500 + dist // 2:,}",
                comfort=4,
                recommended=dist <= 700,
            ),
            TransportOption(
                mode="Sleeper Bus",
                duration=f"{dist // 50}h",
                cost=f"₹{800 + dist // 5:,}–₹{1800 + dist // 4:,}",
                comfort=3,
                recommended=False,
            ),
            TransportOption(
                mode="Self Drive",
                duration=f"{dist // 60}–{dist // 50}h",
                cost=f"₹{dist * 4:,}–₹{dist * 6:,}",
                comfort=4,
                recommended=False,
            ),
        ]

        result = RouteData(
            from_city=state["origin"],
            to_city=state["destination"],
            distance_km=dist,
            transport_options=options,
            scenic_note=mock["scenic"],
            source="Mock (OpenRouteService coming Phase 2)",
        )

        elapsed = round((time.perf_counter() - t0) * 1000)
        return {
            "route": result,
            "meta": {**state.get("meta", {}), "route_ms": elapsed},
        }

    except Exception as exc:
        return {"errors": state.get("errors", []) + [f"route: {exc}"]}