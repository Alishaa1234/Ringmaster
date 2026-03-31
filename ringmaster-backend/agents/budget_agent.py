# agents/budget_agent.py  —  Quartermaster
import time
import json
from graph.state import TripState
from models.schemas import BudgetData, BudgetTier, BudgetBreakdownRow
from agents.openrouter import call_llm


async def budget_node(state: TripState) -> dict:
    t0 = time.perf_counter()
    try:
        result = await _fetch_from_openrouter(state)
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


async def _fetch_from_openrouter(state: TripState) -> BudgetData:
    dest     = state["destination"]
    origin   = state["origin"]
    duration = state["duration"]

    messages = [
        {
            "role": "system",
            "content": "You are a travel budget expert for India. You always respond with valid JSON only — no markdown, no extra text.",
        },
        {
            "role": "user",
            "content": f"""Estimate realistic costs in INR for a {duration}-day trip from {origin} to {dest}, India.

Return ONLY this JSON:
{{
  "transport": {{"low": 0, "mid": 0, "high": 0}},
  "accommodation_per_night": {{"low": 0, "mid": 0, "high": 0}},
  "food_per_day": {{"low": 0, "mid": 0, "high": 0}},
  "total_estimate": {{"low": 0, "mid": 0, "high": 0}},
  "breakdown": [
    {{"label": "Transport (round trip)", "low": 0, "mid": 0, "high": 0}},
    {{"label": "Accommodation ({duration} nights)", "low": 0, "mid": 0, "high": 0}},
    {{"label": "Food & drinks ({duration} days)", "low": 0, "mid": 0, "high": 0}},
    {{"label": "Activities & entry fees", "low": 0, "mid": 0, "high": 0}},
    {{"label": "Local transport & misc", "low": 0, "mid": 0, "high": 0}}
  ],
  "saving_tip": "one specific money saving tip for {dest}"
}}

Replace all 0s with realistic INR estimates specific to {dest}.""",
        },
    ]

    raw  = await call_llm(messages, temperature=0.3)
    start = raw.find("{")
    end   = raw.rfind("}") + 1
    data  = json.loads(raw[start:end])

    return BudgetData(
        transport=BudgetTier(**data["transport"]),
        accommodation_per_night=BudgetTier(**data["accommodation_per_night"]),
        food_per_day=BudgetTier(**data["food_per_day"]),
        total_estimate=BudgetTier(**data["total_estimate"]),
        breakdown=[BudgetBreakdownRow(**r) for r in data["breakdown"]],
        saving_tip=data["saving_tip"],
        source="GPT-4o mini via OpenRouter",
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
            low=1200 + acc_low + food_low + 500,
            mid=4500 + acc_mid + food_mid + 2000,
            high=8000 + acc_high + food_high + 6000,
        ),
        breakdown=[
            BudgetBreakdownRow(label="Transport (round trip)",             low=1200,     mid=4500,    high=8000),
            BudgetBreakdownRow(label=f"Accommodation ({duration} nights)", low=acc_low,  mid=acc_mid, high=acc_high),
            BudgetBreakdownRow(label=f"Food & drinks ({duration} days)",   low=food_low, mid=food_mid,high=food_high),
            BudgetBreakdownRow(label="Activities & entry fees",            low=500,      mid=2000,    high=6000),
            BudgetBreakdownRow(label="Local transport & misc",             low=1000,     mid=2500,    high=5000),
        ],
        saving_tip=f"Book trains 60 days ahead for cheapest fares to {destination}.",
        source="Mock (OpenRouter unavailable)",
    )