# ECMWF AIFS Python Microservice - Implementation Plan

## Overview

Add ECMWF AIFS (AI Forecast System) support to Fish by creating a lightweight Python microservice that downloads, processes, and serves AIFS forecast data.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Railway                                   │
│  ┌─────────────────┐         ┌─────────────────────────────┐   │
│  │   Fish App      │  HTTP   │     AIFS Microservice       │   │
│  │   (Next.js)     │◄───────►│     (FastAPI + Python)      │   │
│  │   Port 3000     │         │     Port 8000               │   │
│  └─────────────────┘         └──────────────┬──────────────┘   │
│                                             │                   │
└─────────────────────────────────────────────┼───────────────────┘
                                              │ GRIB2 Download
                                              ▼
                              ┌───────────────────────────────┐
                              │   ECMWF Open Data Portal      │
                              │   data.ecmwf.int/forecasts/   │
                              │   (Free CC-BY-4.0)            │
                              └───────────────────────────────┘
```

## Directory Structure

```
fish/
├── aifs-service/              # New Python microservice
│   ├── main.py                # FastAPI application
│   ├── ecmwf_client.py        # ECMWF data downloader
│   ├── grib_processor.py      # GRIB2 to JSON converter
│   ├── cache.py               # In-memory caching
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Container build
│   └── railway.toml           # Railway config
├── src/
│   ├── lib/api/
│   │   ├── open-meteo.ts      # Existing (unchanged)
│   │   └── aifs.ts            # New AIFS client
│   └── types/
│       └── forecast.ts        # Add ecmwf_aifs type
└── railway.toml               # Update for multi-service
```

## Implementation Steps

### Phase 1: Python Microservice (Core)

#### Step 1.1: Create service directory and dependencies

**File: `aifs-service/requirements.txt`**
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
ecmwf-opendata==0.3.0
xarray==2024.1.0
cfgrib==0.9.10.4
numpy==1.26.3
httpx==0.26.0
```

#### Step 1.2: ECMWF Data Client

**File: `aifs-service/ecmwf_client.py`**
- Download AIFS forecasts using `ecmwf-opendata` package
- Parameters: `sf` (snowfall), `tp` (total precipitation), `2t` (temperature)
- Handle forecast cycles: 00z, 06z, 12z, 18z
- Retry logic for failed downloads

#### Step 1.3: GRIB2 Processor

**File: `aifs-service/grib_processor.py`**
- Parse GRIB2 files using xarray + cfgrib
- Extract point data for given lat/lon
- Interpolate to daily aggregates
- Convert to JSON format matching Fish's `DailyData` interface

#### Step 1.4: FastAPI Application

**File: `aifs-service/main.py`**
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ecmwf_client import fetch_latest_aifs
from grib_processor import extract_forecast
from cache import forecast_cache

app = FastAPI(title="ECMWF AIFS Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_methods=["GET"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/forecast/{lat}/{lon}")
async def get_forecast(lat: float, lon: float, days: int = 7):
    """Get AIFS forecast for location"""
    cache_key = f"{lat:.2f},{lon:.2f}"

    if cache_key in forecast_cache:
        return forecast_cache[cache_key]

    try:
        grib_data = await fetch_latest_aifs()
        forecast = extract_forecast(grib_data, lat, lon, days)
        forecast_cache[cache_key] = forecast
        return forecast
    except Exception as e:
        raise HTTPException(500, f"Failed to get AIFS data: {e}")
```

#### Step 1.5: Dockerfile

**File: `aifs-service/Dockerfile`**
```dockerfile
FROM python:3.11-slim

# Install ecCodes for GRIB2 support
RUN apt-get update && apt-get install -y \
    libeccodes0 \
    libeccodes-tools \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Phase 2: Frontend Integration

#### Step 2.1: Add AIFS client

**File: `src/lib/api/aifs.ts`**
```typescript
import type { ModelForecast, DailyData, ModelName } from '@/types/forecast';

const AIFS_SERVICE_URL = process.env.NEXT_PUBLIC_AIFS_URL || 'http://localhost:8000';

interface AIFSResponse {
  lat: number;
  lon: number;
  daily: Array<{
    date: string;
    snowfall_sum: number | null;
    precipitation_sum: number | null;
    temp_max: number | null;
    temp_min: number | null;
  }>;
  last_updated: string;
}

export async function fetchAIFS(
  lat: number,
  lon: number,
  days: number = 7
): Promise<ModelForecast | null> {
  try {
    const response = await fetch(
      `${AIFS_SERVICE_URL}/forecast/${lat}/${lon}?days=${days}`
    );

    if (!response.ok) return null;

    const data: AIFSResponse = await response.json();

    return {
      model: 'ecmwf_aifs' as ModelName,
      daily: data.daily.map(d => ({
        date: d.date,
        snowfallSum: d.snowfall_sum,
        precipitationSum: d.precipitation_sum,
        tempMax: d.temp_max,
        tempMin: d.temp_min,
      })),
      lastUpdated: data.last_updated,
      forecastHorizon: 10,
    };
  } catch (error) {
    console.error('Error fetching AIFS:', error);
    return null;
  }
}
```

#### Step 2.2: Update types

**File: `src/types/forecast.ts`** (changes)
```typescript
// Add to ModelName
export type ModelName = 'ecmwf' | 'gfs' | 'graphcast' | 'nbm' | 'hrrr' | 'icon' | 'ecmwf_aifs';

// Add to ForecastResponse.models
models: {
  ecmwf: ModelForecast | null;
  gfs: ModelForecast | null;
  graphcast: ModelForecast | null;
  nbm: ModelForecast | null;
  hrrr: ModelForecast | null;
  icon: ModelForecast | null;
  ecmwf_aifs: ModelForecast | null;  // Add this
};

// Add to MODEL_COLORS
export const MODEL_COLORS: Record<ModelName, string> = {
  // ... existing
  ecmwf_aifs: 'hsl(190 85% 50%)',  // Cyan for AI model
};

// Add to MODEL_INFO
ecmwf_aifs: {
  name: 'ECMWF AIFS',
  fullName: 'ECMWF Artificial Intelligence Forecast System',
  resolution: '25km',
  range: '10 days',
  description: 'ECMWF\'s ML-based weather model. Uses deep learning trained on 40+ years of ERA5 reanalysis data.',
  sourceUrl: 'https://www.ecmwf.int/en/forecasts/documentation-and-support/aifs',
  organization: 'ECMWF (AI)',
},
```

#### Step 2.3: Update open-meteo.ts

Add AIFS to `fetchAllModels()`:
```typescript
import { fetchAIFS } from './aifs';

export async function fetchAllModels(lat: number, lon: number, days: number = 7): Promise<ForecastResponse> {
  const [ecmwf, gfs, graphcast, nbm, hrrr, icon, ecmwf_aifs] = await Promise.all([
    fetchModel('ecmwf', lat, lon, days),
    fetchModel('gfs', lat, lon, days),
    fetchGraphCast(lat, lon, days),
    fetchNBM(lat, lon, days),
    fetchHRRR(lat, lon),
    fetchModel('icon', lat, lon, days),
    fetchAIFS(lat, lon, days),  // Add this
  ]);

  // ... rest of function

  return {
    // ...
    models: { ecmwf, gfs, graphcast, nbm, hrrr, icon, ecmwf_aifs },
    // ...
  };
}
```

### Phase 3: Railway Deployment

#### Step 3.1: Multi-service Railway config

Update root `railway.toml`:
```toml
[build]
builder = "nixpacks"

[build.env]
NIXPACKS_NODE_VERSION = "20"
NEXT_TELEMETRY_DISABLED = "1"

[deploy]
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

Create `aifs-service/railway.toml`:
```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 60
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
numReplicas = 1
```

#### Step 3.2: Deploy to Railway

1. Create new service in Railway project
2. Point to `aifs-service/` directory
3. Set `NEXT_PUBLIC_AIFS_URL` env var in Fish app pointing to AIFS service URL

### Phase 4: Background Data Refresh

#### Step 4.1: Add scheduler for data updates

The AIFS service should pre-fetch data every 6 hours:
- Runs on startup
- Cron schedule: `0 */6 * * *`
- Downloads latest forecast for common grid points
- Warms the cache

**File: `aifs-service/scheduler.py`**
```python
import asyncio
from datetime import datetime
from ecmwf_client import fetch_latest_aifs

async def refresh_data():
    """Download latest AIFS data"""
    print(f"[{datetime.utcnow()}] Starting AIFS data refresh...")
    await fetch_latest_aifs(force=True)
    print(f"[{datetime.utcnow()}] AIFS data refresh complete")

async def start_scheduler():
    """Run refresh every 6 hours"""
    while True:
        await refresh_data()
        await asyncio.sleep(6 * 60 * 60)  # 6 hours
```

## API Response Format

```json
{
  "lat": 35.78,
  "lon": -78.64,
  "model": "ecmwf_aifs",
  "daily": [
    {
      "date": "2026-01-21",
      "snowfall_sum": 0.0,
      "precipitation_sum": 2.5,
      "temp_max": 12.3,
      "temp_min": 4.1
    }
  ],
  "last_updated": "2026-01-21T06:00:00Z",
  "forecast_horizon": 10
}
```

## Cost Estimate

| Resource | Cost |
|----------|------|
| Railway AIFS Service | ~$5/month (within free tier) |
| ECMWF Data | Free (CC-BY-4.0) |
| Storage | Minimal (~500MB GRIB cache) |

## Timeline

| Phase | Tasks | Estimate |
|-------|-------|----------|
| Phase 1 | Python microservice | ~3 hours |
| Phase 2 | Frontend integration | ~1 hour |
| Phase 3 | Railway deployment | ~1 hour |
| Phase 4 | Scheduler + polish | ~1 hour |
| **Total** | | **~6 hours** |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| GRIB2 files large (~100MB) | Cache processed data, not raw files |
| ECMWF server downtime | Graceful fallback, show stale data |
| Cold start latency | Pre-warm cache on startup |
| Railway free tier limits | Monitor usage, upgrade if needed |

## Success Criteria

1. AIFS model appears in Model Breakdown card
2. Snowfall and precipitation data matches ECMWF portal
3. Response time < 2s for cached locations
4. Service stays within Railway free tier

## Future Enhancements

- Add more AIFS parameters (wind, pressure)
- Hourly resolution support
- WebSocket for real-time updates
- Multi-region cache (Redis)
