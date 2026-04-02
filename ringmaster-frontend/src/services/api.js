// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_URL   = BASE_URL.replace(/^http/, 'ws')

/**
 * Stream a trip plan over WebSocket.
 * Calls callbacks as events arrive:
 *   onAgentStart(agentId, name, msg)
 *   onAgentDone(agentId, name, msg, ms)
 *   onAgentError(agentId, name, error)
 *   onComplete(tripResponse)
 *   onError(message)
 */
export function planTripStream({ destination, origin, travel_date, duration }, {
  onAgentStart,
  onAgentDone,
  onAgentError,
  onComplete,
  onError,
}) {
  const ws = new WebSocket(`${WS_URL}/ws/trip`)

  ws.onopen = () => {
    ws.send(JSON.stringify({ destination, origin, travel_date, duration }))
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)

      switch (msg.type) {
        case 'agent_start':
          onAgentStart?.(msg.agent, msg.name, msg.msg)
          break
        case 'agent_done':
          onAgentDone?.(msg.agent, msg.name, msg.msg, msg.ms)
          break
        case 'agent_error':
          onAgentError?.(msg.agent, msg.name, msg.error)
          break
        case 'complete':
          onComplete?.(msg.data)
          ws.close()
          break
        case 'error':
          onError?.(msg.error)
          ws.close()
          break
      }
    } catch (e) {
      onError?.('Failed to parse server message')
    }
  }

  ws.onerror = () => onError?.('WebSocket connection failed — is the backend running?')
  ws.onclose = () => {}

  // Return a cancel function
  return () => ws.close()
}

/**
 * REST fallback for compare (WebSocket not needed there)
 */
export async function compareTrips({ origin, destination_a, destination_b, travel_date, duration }) {
  const res = await fetch(`${BASE_URL}/api/compare`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ origin, destination_a, destination_b, travel_date, duration }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Server error ${res.status}`)
  }
  return res.json()
}

export async function checkHealth() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}