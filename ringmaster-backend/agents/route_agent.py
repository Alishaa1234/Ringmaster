# agents/route_agent.py  —  Trailblazer
"""
LangGraph node: geocodes origin + destination using ORS,
fetches real road distance, writes route key back.
Falls back to a straight-line estimate if no API key.
"""

import time
import math
import httpx
from graph.state import TripState
from models.schemas import RouteData, TransportOption
from config import ORS_API_KEY

ORS_GEOCODE = "https://api.openrouteservice.org/geocode/search"
ORS_MATRIX  = "https://api.openrouteservice.org/v2/matrix/driving-car"

SCENIC_NOTES = {
    "goa":         "The Konkan Railway hugs the Western Ghats coast through 91 tunnels.",
    "shimla":      "The Kalka–Shimla narrow-gauge railway winds through 102 tunnels — a UNESCO Heritage route.",
    "pondicherry": "The coastal highway offers stunning Bay of Bengal views all the way down.",
    "manali":      "The Atal Tunnel makes year-round access possible. Mountain passes await beyond.",
    "jaipur":      "NH 48 cuts through the Aravalli hills — the pink city skyline appears dramatically.",
    "bangalore":   "The expressway cuts through the Deccan plateau — stop at Kamat for authentic Karnataka food.",
    "kolkata":     "The Grand Trunk Road — one of Asia's oldest roads — passes through historic towns.",
    "hyderabad":   "Rocky Deccan landscape lines the route — stop at Gulbarga for famous biryani.",
    "delhi":       "Rajasthan's golden plains flank this route — Udaipur makes a great stopover.",
    "pune":        "The expressway cuts through the Western Ghats — dramatic valley views on the descent.",
    "prayagraj":   "The route follows the Yamuna river plains — one of India's most ancient travel corridors.",
    "varanasi":    "The Gangetic plains open up as you approach — one of the world's oldest inhabited cities.",
    "agra":        "The Yamuna Expressway is one of India's fastest highways — Taj Mahal visible from the outskirts.",
    "udaipur":     "The route winds through Rajasthan's Aravalli range — lake views appear as you descend.",
    "amritsar":    "The Grand Trunk Road passes through the Punjab heartland — fields of wheat line the highway.",
}


async def route_node(state: TripState) -> dict:
    t0 = time.perf_counter()
    try:
        if ORS_API_KEY:
            result = await _fetch_live_route(state)
        else:
            result = _estimate_route(state)

        elapsed = round((time.perf_counter() - t0) * 1000)
        return {
            "route": result,
            "meta": {**state.get("meta", {}), "route_ms": elapsed},
        }
    except Exception as exc:
        # Fallback to estimate if live call fails
        try:
            result = _estimate_route(state)
            return {"route": result, "errors": state.get("errors", []) + [f"route fallback used: {exc}"]}
        except Exception as exc2:
            return {"errors": state.get("errors", []) + [f"route: {exc2}"]}


async def _geocode(client: httpx.AsyncClient, place: str) -> tuple[float, float]:
    """Returns (longitude, latitude) for a place name in India."""
    resp = await client.get(
        ORS_GEOCODE,
        headers={"Authorization": ORS_API_KEY},
        params={
            "text":            f"{place}, India",
            "boundary.country": "IN",
            "size":            1,
        },
        timeout=10,
    )
    resp.raise_for_status()
    features = resp.json().get("features", [])
    if not features:
        raise ValueError(f"Cannot geocode '{place}'")
    coords = features[0]["geometry"]["coordinates"]  # [lng, lat]
    return coords[0], coords[1]


async def _fetch_live_route(state: TripState) -> RouteData:
    origin      = state["origin"]
    destination = state["destination"]

    async with httpx.AsyncClient() as client:
        # Geocode both cities in parallel
        orig_coords, dest_coords = await asyncio.gather(
            _geocode(client, origin),
            _geocode(client, destination),
        ) if False else (
            await _geocode(client, origin),
            await _geocode(client, destination),
        )

        # Get road distance via ORS matrix
        matrix_resp = await client.post(
            ORS_MATRIX,
            headers={
                "Authorization": ORS_API_KEY,
                "Content-Type":  "application/json",
            },
            json={
                "locations": [list(orig_coords), list(dest_coords)],
                "metrics":   ["distance", "duration"],
            },
            timeout=15,
        )
        matrix_resp.raise_for_status()
        matrix = matrix_resp.json()

        dist_m    = matrix["distances"][0][1]
        dist_km   = round(dist_m / 1000)
        duration_s = matrix["durations"][0][1]

    return _build_route_data(origin, destination, dist_km, duration_s, source="OpenRouteService (live)")


def _estimate_route(state: TripState) -> RouteData:
    """
    Straight-line distance fallback when no API key is set.
    Uses rough lat/lng for known Indian cities.
    """
    COORDS = {
        "mumbai": (19.076, 72.877), "delhi": (28.613, 77.209),
        "bangalore": (12.971, 77.594), "chennai": (13.082, 80.270),
        "kolkata": (22.572, 88.363), "hyderabad": (17.385, 78.486),
        "pune": (18.520, 73.856), "jaipur": (26.912, 75.787),
        "ahmedabad": (23.022, 72.571), "surat": (21.170, 72.831),
        "goa": (15.299, 74.124), "shimla": (31.104, 77.167),
        "manali": (32.238, 77.188), "pondicherry": (11.934, 79.830),
        "varanasi": (25.317, 82.973), "agra": (27.176, 78.008),
        "jhansi": (25.448, 78.568), "prayagraj": (25.435, 81.846),
        "lucknow": (26.846, 80.946), "patna": (25.594, 85.137),
        "bhopal": (23.259, 77.412), "indore": (22.719, 75.857),
        "nagpur": (21.145, 79.088), "amritsar": (31.633, 74.872),
        "chandigarh": (30.733, 76.779), "udaipur": (24.571, 73.691),
        "jodhpur": (26.292, 73.014), "kochi": (9.931, 76.267),
        "thiruvananthapuram": (8.524, 76.936), "mysore": (12.295, 76.639),
    }

    a = state["origin"].lower().strip()
    b = state["destination"].lower().strip()

    if a in COORDS and b in COORDS:
        lat1, lon1 = COORDS[a]
        lat2, lon2 = COORDS[b]
        # Haversine formula
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        x = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        straight_km = round(2 * R * math.asin(math.sqrt(x)))
        road_km = round(straight_km * 1.3)  # road is ~30% longer than straight line
    else:
        road_km = 900  # generic fallback

    # Estimate drive duration at avg 60 km/h
    drive_seconds = (road_km / 60) * 3600

    return _build_route_data(
        state["origin"], state["destination"],
        road_km, drive_seconds,
        source="Estimated (add ORS_API_KEY for real distances)",
    )


def _build_route_data(origin: str, destination: str, dist_km: int, duration_s: float, source: str) -> RouteData:
    options = [
        TransportOption(
            mode="Flight",
            duration=f"{max(1, dist_km // 600)}h {(dist_km % 600) // 10}m",
            cost=f"₹{3500 + dist_km * 6:,}–₹{8000 + dist_km * 10:,}",
            comfort=5,
            recommended=dist_km > 700,
        ),
        TransportOption(
            mode="Train (Express)",
            duration=f"{dist_km // 80}h",
            cost=f"₹{600 + dist_km // 3:,}–₹{2500 + dist_km // 2:,}",
            comfort=4,
            recommended=300 < dist_km <= 700,
        ),
        TransportOption(
            mode="Sleeper Bus",
            duration=f"{dist_km // 50}h",
            cost=f"₹{800 + dist_km // 5:,}–₹{1800 + dist_km // 4:,}",
            comfort=3,
            recommended=False,
        ),
        TransportOption(
            mode="Self Drive",
            duration=f"{int(duration_s // 3600)}h {int((duration_s % 3600) // 60)}m",
            cost=f"₹{dist_km * 4:,}–₹{dist_km * 6:,}",
            comfort=4,
            recommended=dist_km <= 300,
        ),
    ]

    scenic = SCENIC_NOTES.get(destination.lower().strip(),
        f"A journey through the heart of India — {origin} to {destination} promises varied landscapes and local culture.")

    return RouteData(
        from_city=origin,
        to_city=destination,
        distance_km=dist_km,
        transport_options=options,
        scenic_note=scenic,
        source=source,
    )


# Import asyncio at top level
import asyncio