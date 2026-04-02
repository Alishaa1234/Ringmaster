# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.trip import router as trip_router
from routers.ws  import router as ws_router
from config import ALLOWED_ORIGINS, APP_ENV

app = FastAPI(
    title="Ringmaster's Round Table API",
    description="Multi-agent travel planning backend powered by LangGraph.",
    version="0.3.0",
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
app.include_router(ws_router)


@app.get("/", tags=["root"])
async def root():
    return {
        "service": "Ringmaster's Round Table",
        "version": "0.3.0",
        "engine":  "LangGraph + WebSocket streaming",
        "env":     APP_ENV,
        "docs":    "/docs",
    }