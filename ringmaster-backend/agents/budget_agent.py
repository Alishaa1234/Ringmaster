# agents/budget_agent.py  —  Quartermaster
"""
LangGraph node: calls Claude API to estimate budget,
writes budget key back. Falls back to mock if no API key.
"""

import time
import json
from graph.state import TripState
from models.schemas import BudgetData, BudgetTier, BudgetBreakdownRow
from config import ANTHROPIC_API_KEY


async def budget_node(state: TripState) -> dict:
    """LangGraph node — returns a partial state update dict."""
    t0 = time.perf_counter()

    try:
        if ANTHROPIC_API_KEY:
            result = await _fetch_from_claude(state)
        else:
            result = _mock_budget(state["destination"], state["duration"])

        elapsed = round((time.perf_counter() - t0) * 1000)
        return {
            "budget": result,
            "meta": {**state.get("meta", {}), "budget_ms": elapsed},
        }

    except Exception as exc:
        return {
            "budget": _mock_budget(state["destination"], state["duration"]),
            "errors": state.get("errors", []) + [f"budget: {exc}"],
        }


async def _fetch_from_claude(state: TripState) -> BudgetData:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

    prompt = f"""You are the Quartermaster — a travel budget expert for India.
Estimate costs for a {state["duration"]}-day trip from {state["origin"]} to {state["destination"]}.

Return ONLY valid JSON, no markdown fences:
{{
  "transport": {{"low": <int>, "mid": <int>, "high": <int>}},
  "accommodation_per_night": {{"low": <int>, "mid": <int>, "high": <int>}},
  "food_per_day": {{"low": <int>, "mid": <int>, "high": <int>}},
  "total_estimate": {{"low": <int>, "mid": <int>, "high": <int>}},
  "breakdown": [
    {{"label": "Transport (round trip)", "low": <int>, "mid": <int>, "high": <int>}},
    {{"label": "Accommodation ({state["duration"]} nights)", "low": <int>, "mid": <int>, "high": <int>}},
    {{"label": "Food & drinks ({state["duration"]} days)", "low": <int>, "mid": <int>, "high": <int>}},
    {{"label": "Activities & entry fees", "low": <int>, "mid": <int>, "high": <int>}},
    {{"label": "Local transport & misc", "low": <int>, "mid": <int>, "high": <int>}}
  ],
  "saving_tip": "<one practical money-saving tip for this specific destination>"
}}

All amounts in INR. Be realistic for Indian travel in 2026."""

    msg = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = msg.content[0].text.replace("```json", "").replace("```", "").strip()
    data = json.loads(raw)

    return BudgetData(
        transport=BudgetTier(**data["transport"]),
        accommodation_per_night=BudgetTier(**data["accommodation_per_night"]),
        food_per_day=BudgetTier(**data["food_per_day"]),
        total_estimate=BudgetTier(**data["total_estimate"]),
        breakdown=[BudgetBreakdownRow(**r) for r in data["breakdown"]],
        saving_tip=data["saving_tip"],
        source="Claude AI (live)",
    )


def _mock_budget(destination: str, duration: int) -> BudgetData:
    acc_low  = 800  * duration
    acc_mid  = 2500 * duration
    acc_high = 8000 * duration
    food_low  = 400  * duration
    food_mid  = 900  * duration
    food_high = 2000 * duration
    return BudgetData(
        transport=BudgetTier(low=1200, mid=4500, high=8000),
        accommodation_per_night=BudgetTier(low=800, mid=2500, high=8000),
        food_per_day=BudgetTier(low=400, mid=900, high=2000),
        total_estimate=BudgetTier(
            low=1200 + acc_low  + food_low  + 500,
            mid=4500 + acc_mid  + food_mid  + 2000,
            high=8000 + acc_high + food_high + 6000,
        ),
        breakdown=[
            BudgetBreakdownRow(label="Transport (round trip)",            low=1200, mid=4500,    high=8000),
            BudgetBreakdownRow(label=f"Accommodation ({duration} nights)",low=acc_low, mid=acc_mid, high=acc_high),
            BudgetBreakdownRow(label=f"Food & drinks ({duration} days)",  low=food_low, mid=food_mid, high=food_high),
            BudgetBreakdownRow(label="Activities & entry fees",           low=500,  mid=2000,    high=6000),
            BudgetBreakdownRow(label="Local transport & misc",            low=1000, mid=2500,    high=5000),
        ],
        saving_tip=(
            f"Book the Konkan Railway 60 days ahead for the cheapest sleeper to {destination}. "
            "Eat at local dhabas for lunch — same food, half the price."
        ),
        source="Mock (no API key)",
    )