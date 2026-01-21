"""
ECMWF AIFS Microservice

FastAPI application serving AIFS forecast data for the Fish weather app.
Currently proxies to Open-Meteo with fallback to mock data.
Full ECMWF GRIB2 integration planned for future.
"""

import logging
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ECMWF AIFS Service",
    description="Serves ECMWF AIFS AI weather model forecasts for the Fish weather app",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Simple in-memory cache
_cache: dict = {}
CACHE_TTL = 3600  # 1 hour


def get_cache_key(lat: float, lon: float, days: int) -> str:
    return f"{lat:.2f},{lon:.2f},{days}"


async def fetch_aifs_from_openmeteo(lat: float, lon: float, days: int) -> dict:
    """
    Try to fetch AIFS data from Open-Meteo.
    Falls back to mock data if AIFS returns nulls.
    """
    try:
        # Try Open-Meteo's AIFS endpoint
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&models=ecmwf_aifs025"
            f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum"
            f"&timezone=auto"
            f"&forecast_days={min(days, 10)}"
        )

        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)

            if response.status_code == 200:
                data = response.json()
                daily = data.get("daily", {})

                # Check if we got real data (not all nulls)
                temps = daily.get("temperature_2m_max", [])
                if temps and any(t is not None for t in temps):
                    # We have temperature data, use it
                    return format_openmeteo_response(data, lat, lon)

        logger.info(f"Open-Meteo AIFS returned no data for ({lat}, {lon}), using mock data")
    except Exception as e:
        logger.warning(f"Open-Meteo AIFS fetch failed: {e}, using mock data")

    # Return mock data
    return generate_mock_forecast(lat, lon, days)


def format_openmeteo_response(data: dict, lat: float, lon: float) -> dict:
    """Format Open-Meteo response to our API format."""
    daily = data.get("daily", {})
    times = daily.get("time", [])

    daily_forecasts = []
    for i, date in enumerate(times):
        daily_forecasts.append({
            "date": date,
            "snowfall_sum": daily.get("snowfall_sum", [None])[i] if i < len(daily.get("snowfall_sum", [])) else None,
            "precipitation_sum": daily.get("precipitation_sum", [None])[i] if i < len(daily.get("precipitation_sum", [])) else None,
            "temp_max": daily.get("temperature_2m_max", [None])[i] if i < len(daily.get("temperature_2m_max", [])) else None,
            "temp_min": daily.get("temperature_2m_min", [None])[i] if i < len(daily.get("temperature_2m_min", [])) else None,
        })

    return {
        "lat": lat,
        "lon": lon,
        "model": "ecmwf_aifs",
        "daily": daily_forecasts,
        "last_updated": datetime.utcnow().isoformat() + "Z",
        "forecast_horizon": len(daily_forecasts),
        "source": "open-meteo",
    }


def generate_mock_forecast(lat: float, lon: float, days: int) -> dict:
    """
    Generate mock AIFS forecast data.
    Uses realistic patterns based on location and season.
    """
    today = datetime.utcnow().date()
    daily_forecasts = []

    # Simple seasonal adjustment based on latitude and month
    month = today.month
    is_winter = month in [12, 1, 2] if lat > 0 else month in [6, 7, 8]
    base_temp = 5 if is_winter else 20

    # Latitude adjustment (colder at higher latitudes)
    lat_adjustment = (abs(lat) - 45) * 0.3
    base_temp -= lat_adjustment

    for i in range(min(days, 10)):
        date = today + timedelta(days=i)

        # Add some variation
        temp_variation = (i % 3 - 1) * 2  # -2, 0, 2 pattern

        temp_max = base_temp + 5 + temp_variation
        temp_min = base_temp - 3 + temp_variation

        # Precipitation chance varies
        precip = 0.0
        snow = 0.0
        if (i + int(lat * 10)) % 4 == 0:  # Some days have precip
            precip = 2.5 + (i % 5)
            if temp_max < 2:  # Cold enough for snow
                snow = precip * 0.8
                precip = precip * 0.2

        daily_forecasts.append({
            "date": date.isoformat(),
            "snowfall_sum": round(snow, 1) if snow > 0 else None,
            "precipitation_sum": round(precip, 1) if precip > 0 else None,
            "temp_max": round(temp_max, 1),
            "temp_min": round(temp_min, 1),
        })

    return {
        "lat": lat,
        "lon": lon,
        "model": "ecmwf_aifs",
        "daily": daily_forecasts,
        "last_updated": datetime.utcnow().isoformat() + "Z",
        "forecast_horizon": len(daily_forecasts),
        "source": "mock",
        "note": "Mock data - full ECMWF GRIB2 integration in progress",
    }


@app.get("/")
async def root():
    """Root endpoint with service info."""
    return {
        "service": "ECMWF AIFS Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "forecast": "/forecast/{lat}/{lon}",
        },
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/forecast/{lat}/{lon}")
async def get_forecast(
    lat: float,
    lon: float,
    days: int = Query(default=10, ge=1, le=10, description="Forecast days (1-10)"),
):
    """
    Get AIFS forecast for a location.

    Args:
        lat: Latitude (-90 to 90)
        lon: Longitude (-180 to 180)
        days: Number of forecast days (default 10, max 10)

    Returns:
        JSON forecast data matching Fish app's DailyData interface
    """
    # Validate coordinates
    if not -90 <= lat <= 90:
        raise HTTPException(400, "Latitude must be between -90 and 90")
    if not -180 <= lon <= 180:
        raise HTTPException(400, "Longitude must be between -180 and 180")

    # Check cache
    cache_key = get_cache_key(lat, lon, days)
    if cache_key in _cache:
        cached_time, cached_data = _cache[cache_key]
        if (datetime.utcnow() - cached_time).seconds < CACHE_TTL:
            logger.debug(f"Cache hit for {cache_key}")
            return JSONResponse(content=cached_data)

    # Fetch data
    try:
        result = await fetch_aifs_from_openmeteo(lat, lon, days)

        # Cache the result
        _cache[cache_key] = (datetime.utcnow(), result)

        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"Error getting forecast for ({lat}, {lon}): {e}")
        raise HTTPException(500, f"Failed to get AIFS forecast: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
