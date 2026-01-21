# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App Router                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐  │
│  │  MapContainer │  │ ForecastPanel │  │    RadarOverlay      │  │
│  │  (MapLibre)   │  │   (Charts)    │  │  (Precipitation)     │  │
│  └──────┬───────┘  └───────┬───────┘  └──────────┬───────────┘  │
│         │                  │                      │              │
│  ┌──────┴──────────────────┴──────────────────────┴───────────┐  │
│  │                    Custom React Hooks                       │  │
│  │  • useWeatherModels  • usePrecipitationData                │  │
│  │  • useViewportGrid   • useRadarAnimation                   │  │
│  └──────────────────────────┬─────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────┴─────────────────────────────────┐  │
│  │                    API Layer                                │  │
│  │  • open-meteo.ts (forecast models)                         │  │
│  │  • precipitation.ts (radar data)                           │  │
│  └──────────────────────────┬─────────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Open-Meteo API   │
                    │  (External Service)│
                    └───────────────────┘
```

## Component Architecture

### Map Components (`src/components/map/`)

| Component | Purpose |
|-----------|---------|
| `MapContainer.tsx` | Main map wrapper, manages view state, integrates all layers |
| `LocationSearch.tsx` | Geocoding search with autocomplete |
| `MapControls.tsx` | Mode toggle (Accumulation/Live), layer visibility |
| `MapLegend.tsx` | Color scale legend for accumulation mode |
| `PrecipitationLayer.tsx` | Heatmap layer for 7-day precipitation totals |
| `RadarOverlay.tsx` | Live radar with MapLibre layers |
| `RadarControls.tsx` | Radar-specific controls (opacity, animation) |
| `RadarLegend.tsx` | Radar color scale |
| `RadarPopup.tsx` | Click popup with precipitation details |

### Forecast Components (`src/components/forecast/`)

| Component | Purpose |
|-----------|---------|
| `ForecastPanel.tsx` | Main forecast display (Sheet on desktop, Drawer on mobile) |
| `DailyComparisonChart.tsx` | Bar chart comparing models by day |
| `ModelAgreementMeter.tsx` | Consensus visualization |
| `ModelTooltip.tsx` | Model info popover |
| `ModelBreakdownCard.tsx` | Detailed model-by-model breakdown |

## Data Flow

### Forecast Data Flow
```
User clicks map → URL params update → useWeatherModels hook
→ fetchAllModels() → Parallel API calls (6 models)
→ calculateAgreement() → ForecastResponse
→ ForecastPanel renders charts and breakdown
```

### Radar Data Flow
```
Map viewport changes → useViewportGrid hook (debounced)
→ Calculate grid points based on zoom level
→ usePrecipitationData hook → fetchPrecipitationGrid()
→ Batch API calls (100 coords/request) with caching
→ buildPrecipitationGeoJSON() → RadarOverlay renders layers
```

### Animation Flow
```
usePrecipitationData provides base data → useRadarAnimation hook
→ Build frames from minutely_15 data → requestAnimationFrame loop
→ Update currentFrame → RadarOverlay re-renders
```

## API Integration

### Open-Meteo Endpoints Used

| Endpoint | Purpose | Models |
|----------|---------|--------|
| `/v1/ecmwf` | European model | ECMWF IFS |
| `/v1/gfs` | American models | GFS, HRRR |
| `/v1/forecast` | Multi-model | ICON, GraphCast, NBM |
| `/geocoding-api/v1/search` | Location search | — |

### Caching Strategy

| Cache | TTL | Purpose |
|-------|-----|---------|
| Weather models | 30 min | Reduce API calls for same location |
| Precipitation grid | 5 min | Radar data freshness |

## State Management

Local React state with custom hooks pattern:
- No global state library
- URL params for location state (shareable links)
- Hooks encapsulate caching and data fetching

## Key Patterns

### Grid Resolution Scaling
```typescript
zoom <= 6  → 1° resolution (~111km cells)
zoom 7-10  → 0.25° resolution (~28km cells)
zoom 11+   → 0.1° resolution (~11km cells)
```

### Model Selection
```typescript
US locations (lat 20-55, lon -135 to -60) → NBM model
International → ECMWF model
```

### Weather Code Mapping (WMO Standard)
```
61-65: Rain
71-77: Snow
66-67: Freezing rain
80-82: Showers
95-99: Thunderstorm
```

## Performance Considerations

1. **Debounced grid updates** - 300ms delay on viewport changes
2. **Batched API calls** - Up to 100 coordinates per request
3. **In-memory caching** - Avoid refetching unchanged data
4. **Dynamic imports** - MapLibre loaded client-side only (SSR disabled)
5. **Frame-based animation** - requestAnimationFrame for smooth playback
6. **Grid size limits** - Max 500 points per viewport to prevent API overload

## Security

- No API keys required (Open-Meteo is free)
- No user data stored
- Client-side only (no server-side secrets)

## Deployment

**Platform:** Railway
**URL:** https://fish-weather-production.up.railway.app

### Build Configuration
- Uses Next.js `output: 'standalone'` for optimized Docker image
- Nixpacks builder (auto-detected)
- Start command: `node .next/standalone/server.js`

### Railway Configuration (`railway.json`)
```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "node .next/standalone/server.js",
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE"
  }
}
```
