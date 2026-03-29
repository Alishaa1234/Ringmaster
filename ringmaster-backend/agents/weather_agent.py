# agents/weather_agent.py  —  Sky Gazer
"""
LangGraph node: reads destination/date/duration from state,
writes weather key back. Falls back to mock if no API key.
"""

import time
import httpx
from datetime import datetime
from graph.state import TripState
from models.schemas import WeatherData, DailyForecast
from config import OPENWEATHER_API_KEY

OWM_BASE = "https://api.openweathermap.org/data/2.5"
GEO_BASE = "https://api.openweathermap.org/geo/1.0"

ICON_MAP = {
    "01": "☀️", "02": "⛅", "03": "🌥", "04": "☁️",
    "09": "🌧", "10": "🌦", "11": "⛈",  "13": "❄️", "50": "🌫",
}

def _icon(code: str) -> str:
    return ICON_MAP.get(code[:2], "🌡")


async def weather_node(state: TripState) -> dict:
    """LangGraph node — returns a partial state update dict."""
    t0 = time.perf_counter()

    try:
        if OPENWEATHER_API_KEY:
            result = await _fetch_live(state["destination"], state["travel_date"], state["duration"])
        else:
            result = _mock(state["destination"], state["duration"])

        elapsed = round((time.perf_counter() - t0) * 1000)
        return {
            "weather": result,
            "meta": {**state.get("meta", {}), "weather_ms": elapsed},
        }

    except Exception as exc:
        return {
            "weather": _mock(state["destination"], state["duration"]),
            "errors": state.get("errors", []) + [f"weather: {exc}"],
        }


async def _fetch_live(destination: str, travel_date: str, duration: int) -> WeatherData:
    async with httpx.AsyncClient(timeout=10) as client:
        geo = (await client.get(
            f"{GEO_BASE}/direct",
            params={"q": f"{destination},IN", "limit": 1, "appid": OPENWEATHER_API_KEY},
        )).json()
        if not geo:
            raise ValueError(f"Cannot geocode '{destination}'")

        lat, lon = geo[0]["lat"], geo[0]["lon"]

        cur = (await client.get(
            f"{OWM_BASE}/weather",
            params={"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"},
        )).json()

        fc = (await client.get(
            f"{OWM_BASE}/forecast",
            params={"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"},
        )).json()

    daily: dict[str, dict] = {}
    for item in fc["list"]:
        dk = item["dt_txt"][:10]
        if dk not in daily:
            daily[dk] = {"highs": [], "lows": [], "icons": [], "descs": []}
        daily[dk]["highs"].append(item["main"]["temp_max"])
        daily[dk]["lows"].append(item["main"]["temp_min"])
        daily[dk]["icons"].append(item["weather"][0]["icon"])
        daily[dk]["descs"].append(item["weather"][0]["description"].capitalize())

    forecast = []
    for i, (_, v) in enumerate(list(daily.items())[:duration]):
        forecast.append(DailyForecast(
            day=f"Day {i+1}",
            icon=_icon(max(set(v["icons"]), key=v["icons"].count)),
            high=round(max(v["highs"]), 1),
            low=round(min(v["lows"]), 1),
            desc=max(set(v["descs"]), key=v["descs"].count),
        ))

    while len(forecast) < duration and forecast:
        last = forecast[-1]
        forecast.append(DailyForecast(
            day=f"Day {len(forecast)+1}",
            icon=last.icon, high=last.high, low=last.low, desc=last.desc,
        ))

    high = cur["main"]["temp_max"]
    hum  = cur["main"]["humidity"]
    return WeatherData(
        condition=cur["weather"][0]["description"].capitalize(),
        temp_high=round(high, 1),
        temp_low=round(cur["main"]["temp_min"], 1),
        humidity=hum,
        forecast=forecast,
        recommendation=_recommend(high, hum, forecast),
        alert=_alert(destination, travel_date, high, hum),
        source="OpenWeatherMap (live)",
    )


def _recommend(high: float, hum: int, forecast: list) -> str:
    tips = []
    if high > 33:   tips.append("Pack light cottons and sunscreen SPF 50+")
    if hum  > 75:   tips.append("carry a small towel — humidity will be high")
    rainy = [f for f in forecast if "rain" in f.desc.lower()]
    if rainy:        tips.append(f"bring a rain jacket ({', '.join(f.day for f in rainy[:2])} may be wet)")
    if not tips:     tips.append("weather looks comfortable — light layers will do")
    return ". ".join(tips).capitalize() + "."


def _alert(destination: str, travel_date: str, high: float, hum: int) -> str:
    try:
        month = datetime.strptime(travel_date, "%Y-%m-%d").month
    except ValueError:
        month = 4
    seasons = {
        range(3,6):  "pre-monsoon — warm and humid",
        range(6,10): "monsoon season — heavy rain possible",
        range(10,12):"post-monsoon — pleasant and green",
    }
    desc = next((v for r, v in seasons.items() if month in r), "winter — cool and dry")
    return (
        f"{destination} is {desc} at this time. "
        f"Temperatures peak ~{high:.0f}°C with {hum}% humidity. "
        f"Best outdoor hours: 7–10am and 4–7pm."
    )


def _mock(destination: str, duration: int) -> WeatherData:
    icons = ["☀️","⛅","🌤","☀️","🌦","⛅","☀️"]
    descs = ["Sunny","Partly cloudy","Mostly sunny","Hot & sunny","Light shower","Sea breeze","Clear"]
    return WeatherData(
        condition="Partly Cloudy",
        temp_high=34.0,
        temp_low=26.0,
        humidity=72,
        forecast=[
            DailyForecast(
                day=f"Day {i+1}",
                icon=icons[i % 7],
                high=round(33 + (i % 3) - 1, 1),
                low=round(26 + (i % 2), 1),
                desc=descs[i % 7],
            )
            for i in range(duration)
        ],
        recommendation="Pack light cottons, sunscreen SPF 50+, and a light rain layer.",
        alert=(
            f"{destination} is warm and humid at this time of year. "
            "Best beach hours: 7–10am and 5–7pm. "
            "(No API key set — add OPENWEATHER_API_KEY to .env for live data.)"
        ),
        source="Mock (no API key)",
    )