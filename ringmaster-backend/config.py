# config.py
from dotenv import load_dotenv
import os

load_dotenv()

OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")
ANTHROPIC_API_KEY:   str = os.getenv("ANTHROPIC_API_KEY", "")
APP_ENV:             str = os.getenv("APP_ENV", "development")
ALLOWED_ORIGINS: list[str] = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173"
).split(",")