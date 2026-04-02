# agents/weather_agent.py  —  Sky Gazer
"""
Primary:  OpenRouter (gpt-4o-mini) — generates realistic weather estimates.
Upgrade:  Set OPENWEATHER_API_KEY in .env for real live forecasts.
Fallback: Static mock if both unavailable.
"""

import time
import json
import httpx
from datetime import datetime
from graph.state import TripState
from models.schemas import WeatherData, DailyForecast
from config import OPENWEATHER_API_KEY
from agents.openrouter import call_llm

OWM_BASE = "https://api.openweathermap.org/data/2.5"
GEO_BASE = "https://api.openweathermap.org/geo/1.0"

ICON_MAP = {
    "01": "☀️", "02": "⛅", "03": "🌥", "04": "☁️",
    "09": "🌧", "10": "🌦", "11": "⛈",  "13": "❄️", "50": "🌫",
}

def _icon(code: str) -> str:
    return ICON_MAP.get(code[:2], "🌡")


async def weather_node(state: TripState) -> dict:
    t0 = time.perf_counter()

    try:
        # Try live OpenWeatherMap first if key exists
        if OPENWEATHER_API_KEY:
            try:
                result = await _fetch_live_owm(
                    state["destination"], state["travel_date"], state["duration"]
                )
                elapsed = round((time.perf_counter() - t0) * 1000)
                return {"weather": result, "meta": {**state.get("meta", {}), "weather_ms": elapsed}}
            except Exception:
                pass  # Fall through to OpenRouter

        # Use OpenRouter as primary/fallback
        result  = await _fetch_from_openrouter(state)
        elapsed = round((time.perf_counter() - t0) * 1000)
        return {
            "weather": result,
            "meta": {**state.get("meta", {}), "weather_ms": elapsed},
        }

    except Exception as exc:
        return {
            "weather": _mock(state["destination"], state["duration"]),
            "errors":  state.get("errors", []) + [f"weather: {exc}"],
        }


# ── OPENROUTER ─────────────────────────────────────────────────────────────

async def _fetch_from_openrouter(state: TripState) -> WeatherData:
    dest     = state["destination"]
    duration = state["duration"]
    date     = state["travel_date"]

    try:
        month = datetime.strptime(date, "%Y-%m-%d").month
        month_name = datetime(2000, month, 1).strftime("%B")
    except ValueError:
        month_name = "April"

    messages = [
        {
            "role": "system",
            "content": (
                "You are a weather expert for Indian cities. "
                "You know the typical seasonal weather patterns for every city in India. "
                "Always respond with valid JSON only — no markdown, no extra text."
            ),
        },
        {
            "role": "user",
            "content": f"""Provide a realistic weather forecast for {dest}, India in {month_name}.

Return ONLY this JSON:
{{
  "condition": "overall weather condition (e.g. Hot & Sunny, Partly Cloudy)",
  "temp_high": <typical daytime high in celsius as number>,
  "temp_low": <typical night low in celsius as number>,
  "humidity": <typical humidity percentage as number>,
  "forecast": [
    {{"day": "Day 1", "icon": "☀️", "high": 34, "low": 26, "desc": "Sunny"}},
    {{"day": "Day 2", "icon": "⛅", "high": 33, "low": 25, "desc": "Partly cloudy"}}
  ],
  "recommendation": "practical packing advice for this weather",
  "alert": "one useful seasonal advisory for {dest} in {month_name}"
}}

Generate exactly {duration} days in forecast array. Use realistic temperatures for {dest} in {month_name}.
Use these icons only: ☀️ ⛅ 🌤 ☁️ 🌧 🌦 ⛈ ❄️ 🌫""",
        },
    ]

    raw   = await call_llm(messages, temperature=0.3)
    start = raw.find("{")
    end   = raw.rfind("}") + 1
    data  = json.loads(raw[start:end])

    forecast = [
        DailyForecast(
            day=f["day"],
            icon=f["icon"],
            high=float(f["high"]),
            low=float(f["low"]),
            desc=f["desc"],
        )
        for f in data.get("forecast", [])[:duration]
    ]

    # Fill if fewer than duration days returned
    while len(forecast) < duration and forecast:
        last = forecast[-1]
        forecast.append(DailyForecast(
            day=f"Day {len(forecast)+1}",
            icon=last.icon, high=last.high, low=last.low, desc=last.desc,
        ))

    return WeatherData(
        condition=data["condition"],
        temp_high=float(data["temp_high"]),
        temp_low=float(data["temp_low"]),
        humidity=int(data["humidity"]),
        forecast=forecast,
        recommendation=data["recommendation"],
        alert=data["alert"],
        source="GPT-4o mini via OpenRouter (estimated)",
    )


# ── OPENWEATHERMAP LIVE (upgrade path) ─────────────────────────────────────

async def _fetch_live_owm(destination: str, travel_date: str, duration: int) -> WeatherData:
    async with httpx.AsyncClient(timeout=10) as client:
        geo_resp = await client.get(
            f"{GEO_BASE}/direct",
            params={"q": f"{destination},IN", "limit": 1, "appid": OPENWEATHER_API_KEY},
        )
        geo_resp.raise_for_status()
        geo = geo_resp.json()
        if not geo:
            raise ValueError(f"Cannot geocode '{destination}'")

        lat, lon = geo[0]["lat"], geo[0]["lon"]

        cur_resp = await client.get(
            f"{OWM_BASE}/weather",
            params={"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"},
        )
        cur_resp.raise_for_status()
        cur = cur_resp.json()

        # 401 means key not activated
        if cur.get("cod") == 401:
            raise ValueError("OWM key not activated yet")

        fc_resp = await client.get(
            f"{OWM_BASE}/forecast",
            params={"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"},
        )
        fc_resp.raise_for_status()
        fc = fc_resp.json()

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


# ── HELPERS ─────────────────────────────────────────────────────────────────

def _recommend(high: float, hum: int, forecast: list) -> str:
    tips = []
    if high > 33:  tips.append("Pack light cottons and sunscreen SPF 50+")
    if hum  > 75:  tips.append("carry a small towel — humidity will be high")
    rainy = [f for f in forecast if "rain" in f.desc.lower()]
    if rainy:      tips.append(f"bring a rain jacket ({', '.join(f.day for f in rainy[:2])} may be wet)")
    if not tips:   tips.append("weather looks comfortable — light layers will do")
    return ". ".join(tips).capitalize() + "."


def _alert(destination: str, travel_date: str, high: float, hum: int) -> str:
    try:
        month = datetime.strptime(travel_date, "%Y-%m-%d").month
    except ValueError:
        month = 4
    seasons = {
        range(3, 6):  "pre-monsoon — warm and humid",
        range(6, 10): "monsoon season — heavy rain possible",
        range(10, 12):"post-monsoon — pleasant and green",
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
        temp_high=34.0, temp_low=26.0, humidity=72,
        forecast=[
            DailyForecast(
                day=f"Day {i+1}", icon=icons[i % 7],
                high=round(33 + (i % 3) - 1, 1),
                low=round(26 + (i % 2), 1),
                desc=descs[i % 7],
            ) for i in range(duration)
        ],
        recommendation="Pack light cottons and sunscreen SPF 50+.",
        alert=f"Estimated weather for {destination}. Add OPENWEATHER_API_KEY to .env for live data.",
        source="Mock (all weather sources unavailable)",
    )