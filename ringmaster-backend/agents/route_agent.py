# agents/route_agent.py  —  Trailblazer
"""
Returns real coordinates, a route polyline, and named waypoints
for the Leaflet map. Uses ORS for live data, falls back to
coordinate interpolation when no API key is set.
"""

import time
import math
import httpx
from graph.state import TripState
from models.schemas import RouteData, TransportOption, Coordinate, Waypoint
from config import ORS_API_KEY

ORS_GEOCODE  = "https://api.openrouteservice.org/geocode/search"
ORS_MATRIX   = "https://api.openrouteservice.org/v2/matrix/driving-car"
ORS_DIRECTIONS = "https://api.openrouteservice.org/v2/directions/driving-car"

# Coordinates for major Indian cities
CITY_COORDS = {
    "mumbai":           (19.0760, 72.8777),
    "delhi":            (28.6139, 77.2090),
    "bangalore":        (12.9716, 77.5946),
    "bengaluru":        (12.9716, 77.5946),
    "chennai":          (13.0827, 80.2707),
    "kolkata":          (22.5726, 88.3639),
    "hyderabad":        (17.3850, 78.4867),
    "pune":             (18.5204, 73.8567),
    "jaipur":           (26.9124, 75.7873),
    "ahmedabad":        (23.0225, 72.5714),
    "surat":            (21.1702, 72.8311),
    "goa":              (15.2993, 74.1240),
    "panaji":           (15.4989, 73.8278),
    "shimla":           (31.1048, 77.1734),
    "manali":           (32.2396, 77.1887),
    "pondicherry":      (11.9416, 79.8083),
    "puducherry":       (11.9416, 79.8083),
    "varanasi":         (25.3176, 82.9739),
    "agra":             (27.1767, 78.0081),
    "jhansi":           (25.4484, 78.5685),
    "prayagraj":        (25.4358, 81.8463),
    "allahabad":        (25.4358, 81.8463),
    "lucknow":          (26.8467, 80.9462),
    "patna":            (25.5941, 85.1376),
    "bhopal":           (23.2599, 77.4126),
    "indore":           (22.7196, 75.8577),
    "nagpur":           (21.1458, 79.0882),
    "amritsar":         (31.6340, 74.8723),
    "chandigarh":       (30.7333, 76.7794),
    "udaipur":          (24.5854, 73.7125),
    "jodhpur":          (26.2389, 73.0243),
    "kochi":            (9.9312, 76.2673),
    "thiruvananthapuram":(8.5241, 76.9366),
    "mysore":           (12.2958, 76.6394),
    "mysuru":           (12.2958, 76.6394),
    "coimbatore":       (11.0168, 76.9558),
    "madurai":          (9.9252, 78.1198),
    "tiruchirappalli":  (10.7905, 78.7047),
    "visakhapatnam":    (17.6868, 83.2185),
    "vijayawada":       (16.5062, 80.6480),
    "bhubaneswar":      (20.2961, 85.8245),
    "guwahati":         (26.1445, 91.7362),
    "shillong":         (25.5788, 91.8933),
    "darjeeling":       (27.0410, 88.2663),
    "gangtok":          (27.3314, 88.6138),
    "leh":              (34.1526, 77.5771),
    "srinagar":         (34.0837, 74.7973),
    "dehradun":         (30.3165, 78.0322),
    "rishikesh":        (30.0869, 78.2676),
    "haridwar":         (29.9457, 78.1642),
    "nainital":         (29.3803, 79.4636),
    "mussoorie":        (30.4598, 78.0664),
    "ooty":             (11.4102, 76.6950),
    "kodaikanal":       (10.2381, 77.4892),
    "munnar":           (10.0892, 77.0597),
    "mahabaleshwar":    (17.9307, 73.6477),
    "lonavala":         (18.7481, 73.4072),
    "aurangabad":       (19.8762, 75.3433),
    "ajmer":            (26.4499, 74.6399),
    "pushkar":          (26.4897, 74.5511),
    "jaisalmer":        (26.9157, 70.9083),
    "bikaner":          (28.0229, 73.3119),
    "ranthambore":      (26.0173, 76.5026),
    "khajuraho":        (24.8318, 79.9199),
}

SCENIC_NOTES = {
    "goa":         "The Konkan Railway hugs the Western Ghats through 91 tunnels and over 2,000 bridges.",
    "shimla":      "The Kalka–Shimla narrow-gauge railway is a UNESCO World Heritage route.",
    "pondicherry": "The coastal highway offers stunning Bay of Bengal views all the way down.",
    "manali":      "The Atal Tunnel (9.2km) makes year-round access possible through the Himalayas.",
    "jaipur":      "NH 48 cuts through the Aravalli hills — the pink city skyline appears dramatically.",
    "agra":        "The Yamuna Expressway is one of India's fastest — Taj Mahal visible from the outskirts.",
    "varanasi":    "The Gangetic plains open up as you approach — one of the world's oldest inhabited cities.",
    "udaipur":     "The route winds through Rajasthan's Aravalli range — lake views as you descend.",
    "leh":         "The Manali–Leh Highway crosses five high-altitude passes — one of the world's great road trips.",
    "darjeeling":  "The Toy Train (DHR) is a UNESCO Heritage route through stunning tea gardens.",
}

# Named waypoints along popular routes
ROUTE_WAYPOINTS = {
    ("mumbai", "goa"):        [("Alibaug", 18.6414, 72.8722), ("Ratnagiri", 16.9902, 73.3120)],
    ("mumbai", "pune"):       [("Lonavala", 18.7481, 73.4072)],
    ("mumbai", "shirdi"):     [("Nashik", 19.9975, 73.7898)],
    ("delhi", "agra"):        [("Mathura", 27.4924, 77.6737)],
    ("delhi", "jaipur"):      [("Alwar", 27.5530, 76.6346)],
    ("delhi", "shimla"):      [("Chandigarh", 30.7333, 76.7794), ("Kalka", 30.8393, 76.9459)],
    ("delhi", "manali"):      [("Chandigarh", 30.7333, 76.7794), ("Mandi", 31.7090, 76.9320)],
    ("delhi", "varanasi"):    [("Agra", 27.1767, 78.0081), ("Prayagraj", 25.4358, 81.8463)],
    ("bangalore", "mysore"):  [("Srirangapatna", 12.4249, 76.6968)],
    ("bangalore", "ooty"):    [("Mysuru", 12.2958, 76.6394), ("Gudalur", 11.5010, 76.4914)],
    ("bangalore", "goa"):     [("Hubli", 15.3647, 75.1240)],
    ("chennai", "pondicherry"):[("Mahabalipuram", 12.6269, 80.1927)],
}


def _get_coords(city: str):
    return CITY_COORDS.get(city.lower().strip())


def _haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return round(2 * R * math.asin(math.sqrt(a)))


def _interpolate_polyline(lat1, lon1, lat2, lon2, steps=8):
    """Generate intermediate points along a curved path between two coords."""
    points = []
    for i in range(steps + 1):
        t = i / steps
        # Simple cubic bezier-like curve with slight arc
        lat = lat1 + (lat2 - lat1) * t
        lng = lon1 + (lon2 - lon1) * t
        # Add a slight natural curve
        curve = math.sin(t * math.pi) * 0.3
        midlat = (lat1 + lat2) / 2
        midlng = (lon1 + lon2) / 2
        lat += (midlat - lat) * curve * 0.1
        lng += (midlng - lng) * curve * 0.05
        points.append([round(lat, 4), round(lng, 4)])
    return points


async def route_node(state: TripState) -> dict:
    t0 = time.perf_counter()
    try:
        if ORS_API_KEY:
            result = await _fetch_live_route(state)
        else:
            result = _build_estimated_route(state)

        elapsed = round((time.perf_counter() - t0) * 1000)
        return {
            "route": result,
            "meta": {**state.get("meta", {}), "route_ms": elapsed},
        }
    except Exception as exc:
        try:
            result = _build_estimated_route(state)
            return {"route": result, "errors": state.get("errors", []) + [f"route fallback: {exc}"]}
        except Exception as exc2:
            return {"errors": state.get("errors", []) + [f"route: {exc2}"]}


async def _fetch_live_route(state: TripState) -> RouteData:
    origin = state["origin"]
    dest   = state["destination"]

    async with httpx.AsyncClient(timeout=15) as client:
        # Geocode both
        orig_resp = await client.get(ORS_GEOCODE, headers={"Authorization": ORS_API_KEY},
            params={"text": f"{origin},India", "boundary.country": "IN", "size": 1})
        dest_resp = await client.get(ORS_GEOCODE, headers={"Authorization": ORS_API_KEY},
            params={"text": f"{dest},India", "boundary.country": "IN", "size": 1})

        orig_resp.raise_for_status()
        dest_resp.raise_for_status()

        orig_feat = orig_resp.json().get("features", [])
        dest_feat = dest_resp.json().get("features", [])

        if not orig_feat or not dest_feat:
            return _build_estimated_route(state)

        orig_lng, orig_lat = orig_feat[0]["geometry"]["coordinates"]
        dest_lng, dest_lat = dest_feat[0]["geometry"]["coordinates"]

        # Get directions with full geometry
        dir_resp = await client.post(
            ORS_DIRECTIONS,
            headers={"Authorization": ORS_API_KEY, "Content-Type": "application/json"},
            json={
                "coordinates": [[orig_lng, orig_lat], [dest_lng, dest_lat]],
                "instructions": True,
                "geometry": True,
            },
        )
        dir_resp.raise_for_status()
        dir_data = dir_resp.json()

    route    = dir_data["routes"][0]
    dist_km  = round(route["summary"]["distance"] / 1000)
    duration = route["summary"]["duration"]

    # Decode geometry (encoded polyline → lat/lng pairs)
    import polyline as pl
    try:
        decoded = pl.decode(route["geometry"])
        polyline_points = [[lat, lng] for lat, lng in decoded[::max(1, len(decoded)//50)]]
    except Exception:
        polyline_points = _interpolate_polyline(orig_lat, orig_lng, dest_lat, dest_lng)

    waypoints = [
        Waypoint(name=origin, lat=orig_lat, lng=orig_lng, type="origin",
                 description=f"Depart from {origin}"),
        Waypoint(name=dest, lat=dest_lat, lng=dest_lng, type="destination",
                 description=f"Arrive in {dest}"),
    ]

    return _build_route_data(
        origin, dest, dist_km, duration,
        Coordinate(lat=orig_lat, lng=orig_lng),
        Coordinate(lat=dest_lat, lng=dest_lng),
        waypoints, polyline_points,
        source="OpenRouteService (live)",
    )


def _build_estimated_route(state: TripState) -> RouteData:
    origin = state["origin"]
    dest   = state["destination"]
    a_key  = origin.lower().strip()
    b_key  = dest.lower().strip()

    orig_coords = _get_coords(a_key)
    dest_coords = _get_coords(b_key)

    if orig_coords and dest_coords:
        olat, olng = orig_coords
        dlat, dlng = dest_coords
        dist_km    = round(_haversine(olat, olng, dlat, dlng) * 1.28)
        polyline   = _interpolate_polyline(olat, olng, dlat, dlng, steps=12)

        # Add known waypoints
        wp_key = (a_key, b_key) if (a_key, b_key) in ROUTE_WAYPOINTS else (b_key, a_key)
        mid_waypoints = []
        if wp_key in ROUTE_WAYPOINTS:
            for (wname, wlat, wlng) in ROUTE_WAYPOINTS[wp_key]:
                mid_waypoints.append(Waypoint(
                    name=wname, lat=wlat, lng=wlng, type="waypoint",
                    description=f"Scenic stop at {wname}",
                ))

        waypoints = [
            Waypoint(name=origin, lat=olat, lng=olng, type="origin",
                     description=f"Your journey begins in {origin}"),
            *mid_waypoints,
            Waypoint(name=dest, lat=dlat, lng=dlng, type="destination",
                     description=f"Welcome to {dest}"),
        ]

        orig_coord = Coordinate(lat=olat, lng=olng)
        dest_coord = Coordinate(lat=dlat, lng=dlng)
        source = "Estimated (add ORS_API_KEY for real route)"
    else:
        dist_km    = 900
        polyline   = []
        waypoints  = []
        orig_coord = None
        dest_coord = None
        source     = "Mock (city not found)"

    duration_s = (dist_km / 60) * 3600
    return _build_route_data(
        origin, dest, dist_km, duration_s,
        orig_coord, dest_coord, waypoints, polyline, source,
    )


def _build_route_data(origin, dest, dist_km, duration_s,
                      orig_coord, dest_coord, waypoints, polyline, source) -> RouteData:
    options = [
        TransportOption(
            mode="✈ Flight",
            duration=f"{max(1, dist_km // 600)}h {(dist_km % 600) // 10}m",
            cost=f"₹{3500 + dist_km * 6:,}–₹{8000 + dist_km * 10:,}",
            comfort=5, recommended=dist_km > 700,
        ),
        TransportOption(
            mode="🚂 Train",
            duration=f"{dist_km // 80}h",
            cost=f"₹{600 + dist_km // 3:,}–₹{2500 + dist_km // 2:,}",
            comfort=4, recommended=300 < dist_km <= 700,
        ),
        TransportOption(
            mode="🚌 Bus",
            duration=f"{dist_km // 50}h",
            cost=f"₹{800 + dist_km // 5:,}–₹{1800 + dist_km // 4:,}",
            comfort=3, recommended=False,
        ),
        TransportOption(
            mode="🚗 Drive",
            duration=f"{int(duration_s//3600)}h {int((duration_s%3600)//60)}m",
            cost=f"₹{dist_km * 4:,}–₹{dist_km * 6:,}",
            comfort=4, recommended=dist_km <= 300,
        ),
    ]

    scenic = SCENIC_NOTES.get(dest.lower().strip(),
        f"The route from {origin} to {dest} winds through the heart of India.")

    return RouteData(
        from_city=origin, to_city=dest,
        distance_km=dist_km,
        transport_options=options,
        scenic_note=scenic,
        source=source,
        origin_coords=orig_coord,
        destination_coords=dest_coord,
        waypoints=waypoints,
        route_polyline=polyline,
    )