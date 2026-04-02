// src/services/adapter.js
export function adaptResponse(response) {
  const {
    destination, origin, travel_date, duration,
    summary, weather, route, budget, itinerary, events, meta,
  } = response

  return {
    destination,
    origin:      origin ?? 'Unknown',
    travelDate:  travel_date,
    duration,
    summary:     summary ?? `A ${duration}-day adventure awaits in ${destination}.`,
    meta:        meta ?? {},

    weather: weather ? {
      condition:      weather.condition,
      tempHigh:       weather.temp_high,
      tempLow:        weather.temp_low,
      humidity:       weather.humidity,
      forecast:       weather.forecast,
      recommendation: weather.recommendation,
      alert:          weather.alert,
      source:         weather.source,
    } : null,

    route: route ? {
      from:             route.from_city,
      to:               route.to_city,
      distanceKm:       route.distance_km,
      transportOptions: route.transport_options,
      scenicNote:       route.scenic_note,
      source:           route.source,
      // Map data
      originCoords:      route.origin_coords,
      destinationCoords: route.destination_coords,
      waypoints:         route.waypoints ?? [],
      routePolyline:     route.route_polyline ?? [],
    } : null,

    budget: budget ? {
      currency:              budget.currency,
      transport:             budget.transport,
      accommodationPerNight: budget.accommodation_per_night,
      foodPerDay:            budget.food_per_day,
      totalEstimate:         budget.total_estimate,
      breakdown:             budget.breakdown,
      savingTip:             budget.saving_tip,
      source:                budget.source,
    } : null,

    itinerary: itinerary ? itinerary.days : null,

    events: events ? {
      festivals:   events.festivals,
      thingsToDo:  events.things_to_do,
      hiddenGems:  events.hidden_gems,
      food:        events.food,
      insiderTip:  events.insider_tip,
      source:      events.source,
    } : null,
  }
}