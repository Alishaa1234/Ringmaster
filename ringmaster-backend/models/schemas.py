# models/schemas.py
from pydantic import BaseModel, Field
from typing import Optional


class TripRequest(BaseModel):
    destination: str = Field(..., example="Goa")
    origin:      str = Field(default="Mumbai", example="Mumbai")
    travel_date: str = Field(..., example="2026-04-10")
    duration:    int = Field(default=7, ge=1, le=30, example=7)


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


class TransportOption(BaseModel):
    mode:        str
    duration:    str
    cost:        str
    comfort:     int
    recommended: bool = False


class Coordinate(BaseModel):
    lat: float
    lng: float

class Waypoint(BaseModel):
    name:        str
    lat:         float
    lng:         float
    type:        str = "waypoint"  # origin | destination | waypoint
    description: Optional[str] = None

class RouteData(BaseModel):
    from_city:         str
    to_city:           str
    distance_km:       int
    transport_options: list[TransportOption]
    scenic_note:       str
    source:            str = "mock"
    # Map data
    origin_coords:      Optional[Coordinate]    = None
    destination_coords: Optional[Coordinate]    = None
    waypoints:          list[Waypoint]          = []
    route_polyline:     list[list[float]]       = []  # [[lat,lng], ...]


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


class CompareRequest(BaseModel):
    destination_a: str = Field(..., example="Goa")
    destination_b: str = Field(..., example="Pondicherry")
    origin:        str = Field(default="Mumbai", example="Mumbai")
    travel_date:   str = Field(..., example="2026-04-10")
    duration:      int = Field(default=5, ge=1, le=14, example=5)

class CompareResponse(BaseModel):
    destination_a: TripResponse
    destination_b: TripResponse
    verdict:       str = ""


class ErrorResponse(BaseModel):
    error:  str
    detail: Optional[str] = None
    agent:  Optional[str] = None