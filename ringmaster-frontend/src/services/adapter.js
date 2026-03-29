// src/services/adapter.js
// ─────────────────────────────────────────────────────────────────────────────
//  Converts the FastAPI TripResponse into the internal plan shape
//  used by all tab components. This keeps the UI decoupled from the API.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {Object} response  Raw TripResponse from FastAPI
 * @returns {Object}         Internal plan shape for tab components
 */
export function adaptResponse(response) {
  const {
    destination, origin, travel_date, duration,
    summary, weather, route, budget, itinerary, meta,
  } = response

  return {
    destination,
    origin:      origin ?? 'Mumbai',
    travelDate:  travel_date,
    duration,
    summary:     summary ?? `A ${duration}-day adventure awaits in ${destination}.`,
    meta:        meta ?? {},

    // ── Weather (Sky Gazer) ──────────────────────────────────────────────
    weather: weather ? {
      condition:      weather.condition,
      tempHigh:       weather.temp_high,
      tempLow:        weather.temp_low,
      humidity:       weather.humidity,
      forecast:       weather.forecast.map(f => ({
        day:  f.day,
        icon: f.icon,
        high: f.high,
        low:  f.low,
        desc: f.desc,
      })),
      recommendation: weather.recommendation,
      alert:          weather.alert,
      source:         weather.source,
    } : null,

    // ── Route (Trailblazer) ──────────────────────────────────────────────
    route: route ? {
      from:             route.from_city,
      to:               route.to_city,
      distanceKm:       route.distance_km,
      transportOptions: route.transport_options.map(o => ({
        mode:        o.mode,
        duration:    o.duration,
        cost:        o.cost,
        comfort:     o.comfort,
        recommended: o.recommended,
      })),
      scenicNote: route.scenic_note,
      source:     route.source,
    } : null,

    // ── Budget (Quartermaster) ───────────────────────────────────────────
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

    // ── Itinerary ────────────────────────────────────────────────────────
    itinerary: itinerary ? itinerary.days.map(d => ({
      day:       d.day,
      title:     d.title,
      morning:   d.morning,
      afternoon: d.afternoon,
      evening:   d.evening,
      tip:       d.tip ?? null,
    })) : null,

    // ── Events (placeholder — Events Agent coming Phase 3) ───────────────
    events: {
      festivals:  ['Live events coming in Phase 3'],
      highlights: ['Local experiences coming in Phase 3'],
      tip:        'Add your Anthropic API key to unlock AI-powered event recommendations.',
    },
  }
}