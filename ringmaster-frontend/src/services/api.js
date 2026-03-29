// src/services/api.js
// ─────────────────────────────────────────────────────────────────────────────
//  All backend calls live here. Swap BASE_URL in .env to point to production.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Plan a trip — invokes the LangGraph pipeline.
 * @param {{ destination, origin, travel_date, duration }} payload
 * @returns {Promise<TripResponse>}
 */
export async function planTrip({ destination, origin = 'Mumbai', travel_date, duration }) {
  const res = await fetch(`${BASE_URL}/api/trip`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ destination, origin, travel_date, duration }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Server error ${res.status}`)
  }

  return res.json()
}

/**
 * Health check — tells us if the backend is reachable.
 * @returns {Promise<boolean>}
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}