# main.py
"""
Ringmaster's Round Table — FastAPI + LangGraph Backend
Run:   uvicorn main:app --reload
Docs:  http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.trip import router as trip_router
from config import ALLOWED_ORIGINS, APP_ENV

app = FastAPI(
    title="Ringmaster's Round Table API",
    description=(
        "Multi-agent travel planning backend powered by LangGraph. "
        "Sky Gazer, Trailblazer, Quartermaster, and Itinerary Agent "
        "run in parallel to forge the perfect tour plan."
    ),
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trip_router)


@app.get("/", tags=["root"])
async def root():
    return {
        "service": "Ringmaster's Round Table",
        "version": "0.2.0",
        "engine":  "LangGraph StateGraph",
        "env":     APP_ENV,
        "docs":    "/docs",
    }