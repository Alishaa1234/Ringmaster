# agents/route_agent.py  —  Trailblazer
"""
Uses OSRM (free, no API key) for real road routing.
Geocoding via Nominatim (OpenStreetMap, free, no API key).
Falls back to coordinate interpolation if both fail.
"""

import time
import math
import httpx
from graph.state import TripState
from models.schemas import RouteData, TransportOption, Coordinate, Waypoint
from config import ORS_API_KEY

# Free APIs — no key needed
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OSRM_URL      = "https://router.project-osrm.org/route/v1/driving"

# ORS as upgrade (if key set)
ORS_GEOCODE    = "https://api.openrouteservice.org/geocode/search"
ORS_DIRECTIONS = "https://api.openrouteservice.org/v2/directions/driving-car"

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
    "jaisalmer":        (26.9157, 70.9083),
    "bikaner":          (28.0229, 73.3119),
    "kochi":            (9.9312, 76.2673),
    "thiruvananthapuram":(8.5241, 76.9366),
    "mysore":           (12.2958, 76.6394),
    "mysuru":           (12.2958, 76.6394),
    "coimbatore":       (11.0168, 76.9558),
    "madurai":          (9.9252, 78.1198),
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
    "ranthambore":      (26.0173, 76.5026),
    "khajuraho":        (24.8318, 79.9199),
    "shirdi":           (19.7655, 74.4762),
    "tirupati":         (13.6288, 79.4192),
    "vrindavan":        (27.5794, 77.6964),
    "mathura":          (27.4924, 77.6737),
    "puri":             (19.8106, 85.8314),
    "konark":           (19.8876, 86.0948),
    "hampi":            (15.3350, 76.4600),
    "badami":           (15.9181, 75.6804),
    "kolhapur":         (16.7050, 74.2433),
    "nashik":           (19.9975, 73.7898),
    "ratnagiri":        (16.9902, 73.3120),
    "alibaug":          (18.6414, 72.8722),
    "mahabalipuram":    (12.6269, 80.1927),
    "rameswaram":       (9.2876, 79.3129),
    "kanyakumari":      (8.0883, 77.5385),
}

SCENIC_NOTES = {
    "goa":         "The Konkan Railway hugs the Western Ghats through 91 tunnels. NH66 offers stunning coastal views.",
    "shimla":      "The Kalka–Shimla narrow-gauge railway is UNESCO Heritage. NH5 winds through pine forests.",
    "pondicherry": "The East Coast Road (ECR) is one of India's most scenic coastal highways.",
    "manali":      "The Atal Tunnel (9.2km) enables year-round access. Rohtang Pass offers Himalayan panoramas.",
    "jaipur":      "NH48 cuts through the Aravalli hills — fort silhouettes dot the skyline as you approach.",
    "agra":        "The Yamuna Expressway is India's fastest 6-lane highway. Taj Mahal appears on the horizon.",
    "varanasi":    "NH19 crosses the Gangetic plains — the spires of Varanasi rise dramatically from flat land.",
    "leh":         "The Manali–Leh Highway crosses five passes above 4,000m — one of the world's great drives.",
    "ooty":        "The Nilgiri Mountain Railway is UNESCO Heritage. NH181 winds through tea estates.",
    "munnar":      "NH85 climbs through cardamom and tea plantations with constant Himalayan-scale views.",
}


async def route_node(state: TripState) -> dict:
    t0 = time.perf_counter()
    try:
        result  = await _fetch_route(state)
        elapsed = round((time.perf_counter() - t0) * 1000)
        return {
            "route": result,
            "meta": {**state.get("meta", {}), "route_ms": elapsed},
        }
    except Exception as exc:
        return {
            "route":  _fallback_route(state),
            "errors": state.get("errors", []) + [f"route: {exc}"],
        }


async def _fetch_route(state: TripState) -> RouteData:
    origin = state["origin"]
    dest   = state["destination"]

    # Step 1 — Geocode both cities
    olat, olng = await _geocode(origin)
    dlat, dlng = await _geocode(dest)

    # Step 2 — Get real road route from OSRM
    try:
        polyline, dist_km, duration_s = await _osrm_route(olng, olat, dlng, dlat)
        source = "OpenStreetMap + OSRM (real roads)"
    except Exception:
        # Fallback to interpolated line
        polyline  = _interpolate(olat, olng, dlat, dlng, steps=20)
        dist_km   = round(_haversine(olat, olng, dlat, dlng) * 1.28)
        duration_s = (dist_km / 60) * 3600
        source    = "OpenStreetMap (estimated path)"

    # Step 3 — Build waypoints
    waypoints = _build_waypoints(origin, dest, olat, olng, dlat, dlng)

    return _build_route_data(
        origin, dest, dist_km, duration_s,
        Coordinate(lat=olat, lng=olng),
        Coordinate(lat=dlat, lng=dlng),
        waypoints, polyline, source,
    )


async def _geocode(city: str) -> tuple[float, float]:
    """Geocode using Nominatim (free OSM geocoder) with local fallback."""
    key = city.lower().strip()

    # Check local coords first (faster, no rate limit)
    if key in CITY_COORDS:
        return CITY_COORDS[key]

    # Nominatim for unknown cities
    async with httpx.AsyncClient(timeout=8, headers={"User-Agent": "RingmastersRoundTable/1.0"}) as client:
        resp = await client.get(NOMINATIM_URL, params={
            "q":              f"{city}, India",
            "format":         "json",
            "limit":          1,
            "countrycodes":   "in",
            "addressdetails": 0,
        })
        resp.raise_for_status()
        results = resp.json()

    if results:
        return float(results[0]["lat"]), float(results[0]["lon"])

    raise ValueError(f"Cannot geocode '{city}'")


async def _osrm_route(olng, olat, dlng, dlat) -> tuple[list, int, float]:
    """
    Calls OSRM public API for real road routing.
    Returns (polyline_points, distance_km, duration_seconds).
    OSRM returns encoded polyline in the geometry field.
    """
    url = f"{OSRM_URL}/{olng},{olat};{dlng},{dlat}"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params={
            "overview":    "full",
            "geometries":  "geojson",
            "steps":       "false",
            "annotations": "false",
        })
        resp.raise_for_status()
        data = resp.json()

    if data.get("code") != "Ok":
        raise ValueError(f"OSRM error: {data.get('code')}")

    route    = data["routes"][0]
    dist_km  = round(route["distance"] / 1000)
    duration = route["duration"]

    # GeoJSON coordinates are [lng, lat] — convert to [lat, lng] for Leaflet
    coords = route["geometry"]["coordinates"]
    # Sample points to keep payload reasonable (max 200 points)
    step = max(1, len(coords) // 200)
    polyline = [[round(c[1], 5), round(c[0], 5)] for c in coords[::step]]

    # Always include last point
    if polyline[-1] != [round(coords[-1][1], 5), round(coords[-1][0], 5)]:
        polyline.append([round(coords[-1][1], 5), round(coords[-1][0], 5)])

    return polyline, dist_km, duration


def _build_waypoints(origin, dest, olat, olng, dlat, dlng) -> list[Waypoint]:
    waypoints = [
        Waypoint(name=origin, lat=olat, lng=olng, type="origin",
                 description=f"Your journey begins in {origin}"),
    ]

    # Add known scenic stops
    ak = origin.lower().strip()
    bk = dest.lower().strip()
    known = {
        ("mumbai", "goa"):        [("Alibaug", 18.6414, 72.8722), ("Ratnagiri", 16.9902, 73.3120), ("Malvan", 16.0601, 73.4673)],
        ("mumbai", "pune"):       [("Lonavala", 18.7481, 73.4072), ("Khandala", 18.7646, 73.3852)],
        ("delhi", "agra"):        [("Mathura", 27.4924, 77.6737), ("Vrindavan", 27.5794, 77.6964)],
        ("delhi", "jaipur"):      [("Neemrana", 27.9753, 76.3936), ("Shahpura", 27.3873, 75.9605)],
        ("delhi", "shimla"):      [("Chandigarh", 30.7333, 76.7794), ("Kalka", 30.8393, 76.9459)],
        ("delhi", "manali"):      [("Chandigarh", 30.7333, 76.7794), ("Mandi", 31.7090, 76.9320), ("Kullu", 31.9574, 77.1095)],
        ("delhi", "varanasi"):    [("Agra", 27.1767, 78.0081), ("Prayagraj", 25.4358, 81.8463)],
        ("bangalore", "goa"):     [("Hubli", 15.3647, 75.1240), ("Karwar", 14.8136, 74.1295)],
        ("bangalore", "ooty"):    [("Mysuru", 12.2958, 76.6394), ("Gudalur", 11.5010, 76.4914)],
        ("bangalore", "mysore"):  [("Srirangapatna", 12.4249, 76.6968)],
        ("chennai", "pondicherry"):[("Mahabalipuram", 12.6269, 80.1927), ("Kalpakkam", 12.5463, 80.1697)],
        ("mumbai", "shirdi"):     [("Nashik", 19.9975, 73.7898), ("Igatpuri", 19.6948, 73.5571)],
        ("jaipur", "jaisalmer"):  [("Jodhpur", 26.2389, 73.0243), ("Pokhran", 26.9273, 71.9154)],
        ("kolkata", "darjeeling"):[("Siliguri", 26.7271, 88.3953), ("Kurseong", 26.8816, 88.2773)],
    }

    key = (ak, bk) if (ak, bk) in known else ((bk, ak) if (bk, ak) in known else None)
    if key:
        stops = known[key]
        if key == (bk, ak):
            stops = list(reversed(stops))
        for (wname, wlat, wlng) in stops:
            waypoints.append(Waypoint(
                name=wname, lat=wlat, lng=wlng, type="waypoint",
                description=f"Scenic stop — {wname}",
            ))

    waypoints.append(Waypoint(name=dest, lat=dlat, lng=dlng, type="destination",
                              description=f"Welcome to {dest}"))
    return waypoints


def _haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return 2 * R * math.asin(math.sqrt(a))


def _interpolate(lat1, lon1, lat2, lon2, steps=20) -> list:
    return [[
        round(lat1 + (lat2 - lat1) * i / steps, 5),
        round(lon1 + (lon2 - lon1) * i / steps, 5),
    ] for i in range(steps + 1)]


def _fallback_route(state: TripState) -> RouteData:
    origin = state["origin"]
    dest   = state["destination"]
    oc     = CITY_COORDS.get(origin.lower().strip())
    dc     = CITY_COORDS.get(dest.lower().strip())

    if oc and dc:
        dist_km  = round(_haversine(*oc, *dc) * 1.28)
        polyline = _interpolate(oc[0], oc[1], dc[0], dc[1])
        orig_c   = Coordinate(lat=oc[0], lng=oc[1])
        dest_c   = Coordinate(lat=dc[0], lng=dc[1])
        waypoints = [
            Waypoint(name=origin, lat=oc[0], lng=oc[1], type="origin", description=f"Depart {origin}"),
            Waypoint(name=dest,   lat=dc[0], lng=dc[1], type="destination", description=f"Arrive {dest}"),
        ]
    else:
        dist_km = 900; polyline = []; orig_c = None; dest_c = None; waypoints = []

    return _build_route_data(origin, dest, dist_km, dist_km/60*3600,
                             orig_c, dest_c, waypoints, polyline, "Estimated (OSRM unavailable)")


def _build_route_data(origin, dest, dist_km, duration_s,
                      orig_coord, dest_coord, waypoints, polyline, source) -> RouteData:
    options = [
        TransportOption(mode="✈ Flight",
            duration=f"{max(1, dist_km//600)}h {(dist_km%600)//10}m",
            cost=f"₹{3500+dist_km*6:,}–₹{8000+dist_km*10:,}",
            comfort=5, recommended=dist_km > 700),
        TransportOption(mode="🚂 Train",
            duration=f"{dist_km//80}h",
            cost=f"₹{600+dist_km//3:,}–₹{2500+dist_km//2:,}",
            comfort=4, recommended=300 < dist_km <= 700),
        TransportOption(mode="🚌 Bus",
            duration=f"{dist_km//50}h",
            cost=f"₹{800+dist_km//5:,}–₹{1800+dist_km//4:,}",
            comfort=3, recommended=False),
        TransportOption(mode="🚗 Drive",
            duration=f"{int(duration_s//3600)}h {int((duration_s%3600)//60)}m",
            cost=f"₹{dist_km*4:,}–₹{dist_km*6:,}",
            comfort=4, recommended=dist_km <= 300),
    ]

    scenic = SCENIC_NOTES.get(dest.lower().strip(),
        f"The road from {origin} to {dest} winds through diverse Indian landscapes.")

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