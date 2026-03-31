# models/schemas.py
from pydantic import BaseModel, Field
from typing import Optional


# ── REQUEST ────────────────────────────────────────────────────────────────

class TripRequest(BaseModel):
    destination: str = Field(..., example="Goa")
    origin:      str = Field(default="Mumbai", example="Mumbai")
    travel_date: str = Field(..., example="2026-04-10")
    duration:    int = Field(default=7, ge=1, le=30, example=7)


# ── WEATHER ────────────────────────────────────────────────────────────────

class DailyForecast(BaseModel):
    day:  str
    icon: str
    high: float
    low:  float
    desc: str

class WeatherData(BaseModel):
    condition:      str
    temp_high:      float
    temp_low:       float
    humidity:       int
    forecast:       list[DailyForecast]
    recommendation: str
    alert:          str
    source:         str = "OpenWeatherMap"


# ── ROUTE ──────────────────────────────────────────────────────────────────

class TransportOption(BaseModel):
    mode:        str
    duration:    str
    cost:        str
    comfort:     int
    recommended: bool = False

class RouteData(BaseModel):
    from_city:         str
    to_city:           str
    distance_km:       int
    transport_options: list[TransportOption]
    scenic_note:       str
    source:            str = "mock"


# ── BUDGET ─────────────────────────────────────────────────────────────────

class BudgetTier(BaseModel):
    low:  int
    mid:  int
    high: int

class BudgetBreakdownRow(BaseModel):
    label: str
    low:   int
    mid:   int
    high:  int

class BudgetData(BaseModel):
    currency:                str = "INR"
    transport:               BudgetTier
    accommodation_per_night: BudgetTier
    food_per_day:            BudgetTier
    total_estimate:          BudgetTier
    breakdown:               list[BudgetBreakdownRow]
    saving_tip:              str
    source:                  str = "Claude AI"


# ── ITINERARY ──────────────────────────────────────────────────────────────

class ItineraryDay(BaseModel):
    day:       int
    title:     str
    morning:   str
    afternoon: str
    evening:   str
    tip:       Optional[str] = None

class ItineraryData(BaseModel):
    days:   list[ItineraryDay]
    source: str = "Claude AI"


# ── EVENTS ─────────────────────────────────────────────────────────────────

class EventItem(BaseModel):
    name:        str
    description: str
    date:        Optional[str] = None
    category:    Optional[str] = None

class EventsData(BaseModel):
    festivals:    list[EventItem]
    things_to_do: list[EventItem]
    hidden_gems:  list[EventItem]
    food:         list[EventItem]
    insider_tip:  str
    source:       str = "Claude AI"


# ── COMBINED RESPONSE ──────────────────────────────────────────────────────

class TripResponse(BaseModel):
    destination: str
    origin:      str
    travel_date: str
    duration:    int
    summary:     Optional[str]           = None
    weather:     Optional[WeatherData]   = None
    route:       Optional[RouteData]     = None
    budget:      Optional[BudgetData]    = None
    itinerary:   Optional[ItineraryData] = None
    events:      Optional[EventsData]    = None
    meta:        dict = Field(default_factory=dict)


# ── ERROR ──────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    error:  str
    detail: Optional[str] = None
    agent:  Optional[str] = None