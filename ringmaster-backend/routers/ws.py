# routers/ws.py
"""
WebSocket endpoint — /ws/trip

Streams agent status events to the frontend in real time.
Each message is a JSON object:

  { "type": "agent_start",  "agent": "weather",   "msg": "Reading the skies…" }
  { "type": "agent_done",   "agent": "weather",   "msg": "Forecast ready", "ms": 320 }
  { "type": "agent_error",  "agent": "weather",   "error": "..." }
  { "type": "complete",     "data": { ...TripResponse... } }
  { "type": "error",        "error": "..." }
"""

import json
import asyncio
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from agents.weather_agent   import weather_node
from agents.route_agent     import route_node
from agents.budget_agent    import budget_node
from agents.itinerary_agent import itinerary_node
from agents.events_agent    import events_node
from models.schemas import TripResponse

router = APIRouter(tags=["websocket"])

AGENT_META = {
    "weather":   {"name": "Sky Gazer",     "start_msg": "Reading the skies…"},
    "route":     {"name": "Trailblazer",   "start_msg": "Charting the roads…"},
    "budget":    {"name": "Quartermaster", "start_msg": "Counting the coins…"},
    "itinerary": {"name": "Itinerary",     "start_msg": "Crafting your days…"},
    "events":    {"name": "Events",        "start_msg": "Finding local events…"},
}


async def run_agent_with_events(ws: WebSocket, agent_id: str, node_fn, state: dict) -> dict:
    """Runs a single agent node, sending start/done/error events over WebSocket."""
    meta = AGENT_META[agent_id]

    # Send start event
    await ws.send_json({
        "type":  "agent_start",
        "agent": agent_id,
        "name":  meta["name"],
        "msg":   meta["start_msg"],
    })

    t0 = time.perf_counter()
    try:
        result = await node_fn(state)
        elapsed = round((time.perf_counter() - t0) * 1000)

        # Send done event
        await ws.send_json({
            "type":    "agent_done",
            "agent":   agent_id,
            "name":    meta["name"],
            "msg":     f"Done in {elapsed}ms",
            "ms":      elapsed,
        })
        return result

    except Exception as exc:
        elapsed = round((time.perf_counter() - t0) * 1000)
        await ws.send_json({
            "type":  "agent_error",
            "agent": agent_id,
            "name":  meta["name"],
            "error": str(exc),
            "ms":    elapsed,
        })
        return {}


def _serialize(obj):
    """Convert Pydantic models to JSON-serializable dicts."""
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    return obj


@router.websocket("/ws/trip")
async def websocket_trip(ws: WebSocket):
    await ws.accept()

    try:
        # 1. Receive the trip request from the client
        raw = await ws.receive_text()
        req = json.loads(raw)

        destination = req.get("destination", "")
        origin      = req.get("origin", "Mumbai")
        travel_date = req.get("travel_date", "")
        duration    = int(req.get("duration", 7))

        if not destination or not travel_date:
            await ws.send_json({"type": "error", "error": "destination and travel_date are required"})
            await ws.close()
            return

        # 2. Build shared state
        state = {
            "destination": destination,
            "origin":      origin,
            "travel_date": travel_date,
            "duration":    duration,
            "weather":     None,
            "route":       None,
            "budget":      None,
            "itinerary":   None,
            "events":      None,
            "summary":     None,
            "meta":        {},
            "errors":      [],
        }

        # 3. Send planning_start event
        await ws.send_json({
            "type": "planning_start",
            "destination": destination,
            "duration": duration,
        })

        # 4. Run all agents in parallel, streaming events as each finishes
        t_total = time.perf_counter()

        results = await asyncio.gather(
            run_agent_with_events(ws, "weather",   weather_node,   state),
            run_agent_with_events(ws, "route",     route_node,     state),
            run_agent_with_events(ws, "budget",    budget_node,    state),
            run_agent_with_events(ws, "itinerary", itinerary_node, state),
            run_agent_with_events(ws, "events",    events_node,    state),
        )

        # 5. Merge all results into final state
        for result in results:
            state.update(result)

        total_ms = round((time.perf_counter() - t_total) * 1000)

        # 6. Build summary
        parts = [f"A {duration}-day adventure awaits in {destination}."]
        if state.get("weather"):
            w = state["weather"]
            parts.append(f"Expect {w.condition.lower()} skies around {w.temp_high}°C.")
        if state.get("budget"):
            b = state["budget"]
            parts.append(f"Budget from ₹{b.total_estimate.low:,} to ₹{b.total_estimate.high:,}.")

        state["summary"] = " ".join(parts)
        state["meta"]["total_ms"] = total_ms

        # 7. Send complete event with full trip data
        response = TripResponse(
            destination=state["destination"],
            origin=state["origin"],
            travel_date=state["travel_date"],
            duration=state["duration"],
            summary=state.get("summary"),
            weather=state.get("weather"),
            route=state.get("route"),
            budget=state.get("budget"),
            itinerary=state.get("itinerary"),
            events=state.get("events"),
            meta=state.get("meta", {}),
        )

        await ws.send_json({
            "type": "complete",
            "data": response.model_dump(),
        })

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        try:
            await ws.send_json({"type": "error", "error": str(exc)})
        except Exception:
            pass
    finally:
        try:
            await ws.close()
        except Exception:
            pass