# Fish - Multi-Model Weather Forecast Comparison

## Project Overview

Fish is a weather visualization app that compares forecasts from multiple meteorological models (ECMWF, GFS, GraphCast, NBM, HRRR, ICON) to help users make informed decisions about upcoming weather.

**Live URL:** https://fish-weather-production.up.railway.app

## Tech Stack

- **Framework:** Next.js 14.2 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Mapping:** MapLibre GL + react-map-gl
- **Charts:** Recharts
- **Data:** Open-Meteo API (free, no authentication)
- **Deployment:** Railway

## Project Structure

```
fish/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/
│   │   ├── forecast/        # Forecast panel, charts, model comparison
│   │   ├── map/             # Map, radar, precipitation layers
│   │   ├── theme/           # ThemeProvider, ThemeToggle
│   │   └── ui/              # shadcn/ui base components
│   ├── lib/
│   │   ├── api/             # Open-Meteo API clients
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Utility functions
│   ├── types/               # TypeScript interfaces
│   └── constants/           # Color scales, thresholds
├── aifs-service/            # Python microservice for ECMWF AIFS (planned)
├── docs/                    # Documentation and plans
├── ARCHITECTURE.md          # System architecture documentation
└── README.md                # Project overview
```

## Key Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint

# Deployment
railway up --detach  # Deploy to Railway
```

## Weather Models

| Model | Source | Resolution | Range | Notes |
|-------|--------|------------|-------|-------|
| ECMWF | European | 9km | 15 days | Gold standard |
| GFS | NOAA (US) | 25km | 16 days | Global coverage |
| GraphCast | Google DeepMind | 25km | 10 days | AI-powered |
| NBM | NOAA (US) | ~3km | 10 days | US-only ensemble |
| HRRR | NOAA (US) | 3km | 48 hours | US high-resolution |
| ICON | DWD (German) | 13km | 7 days | European strength |

## Visualization Modes

1. **Accumulation Mode** - 7-day precipitation totals on map
   - Snow accumulation heatmap
   - Rain accumulation heatmap
   - Toggle between Snow/Rain/All

2. **Live Radar Mode** - Real-time precipitation
   - Intensity overlay
   - Animation controls
   - Click-for-details popup

## API Endpoints Used

All data from Open-Meteo (free, no API key):
- `/v1/ecmwf` - ECMWF IFS forecasts
- `/v1/gfs` - GFS and HRRR forecasts
- `/v1/forecast` - Multi-model (ICON, GraphCast, NBM)
- `/geocoding-api/v1/search` - Location search

## Patterns & Conventions

- **State Management:** Local React state + URL params (no global store)
- **Data Fetching:** Custom hooks with caching (`useWeatherModels`, `usePrecipitationData`)
- **Styling:** Tailwind CSS with shadcn/ui components
- **Themes:** Dark/light mode via ThemeProvider
- **Map Layers:** GeoJSON sources with MapLibre GL layers
