# Fish - Multi-Model Weather Forecast Comparison

🌐 **Live:** https://fish-production-dccf.up.railway.app

A weather visualization app that compares forecasts from multiple meteorological models to help you make informed decisions about upcoming weather.

## Features

### Multi-Model Forecast Comparison
Compare forecasts from 6 different weather models:
- **ECMWF** (European) - Gold standard, 9km resolution, 15-day forecast
- **GFS** (American) - NOAA's global model, 25km resolution, 16-day forecast
- **GraphCast** (Google DeepMind AI) - AI-powered predictions, 10-day forecast
- **NBM** (National Blend of Models) - US-focused ensemble, ~3km resolution
- **HRRR** (High-Resolution Rapid Refresh) - 3km, 48-hour US detail
- **ICON** (German) - 13km resolution, 7-day forecast

### Visualization Modes

**Accumulation Mode** - View 7-day precipitation totals:
- Snow accumulation heatmap
- Rain accumulation heatmap
- Total precipitation visualization
- Model-by-model comparison charts

**Live Radar Mode** - Real-time precipitation visualization:
- Current precipitation intensity overlay
- Precipitation type indicators (rain, snow, freezing rain, thunderstorm)
- Animation with historical frames
- Click-for-details popup

### Theme Support
- Light theme (default): Warm cream backgrounds, deep slate typography
- Dark theme: Softer midnight aesthetic
- System theme detection
- Toggle between themes via sun/moon icon

### Miller's Law Design
UI organized into 7 cognitive chunks for optimal information processing:
1. Location context header
2. Time/type controls
3. Model agreement summary
4. Forecast visualization chart
5. Detailed model breakdown
6. Model legend grid
7. Footer actions

### Interactive Map
- Click anywhere to get forecasts for that location
- Geolocation support for current position
- Location search with autocomplete
- Responsive design (desktop + mobile)
- Theme-aware map styles (Positron light / Dark Matter)

## Tech Stack

- **Framework**: Next.js 14.2 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Mapping**: MapLibre GL + react-map-gl
- **Charts**: Recharts
- **Data**: Open-Meteo API (free, no authentication)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── forecast/           # Forecast panel, charts, model comparison
│   ├── map/                # Map, radar overlay, precipitation layers
│   ├── theme/              # ThemeProvider, ThemeToggle
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── api/                # Open-Meteo API clients
│   ├── hooks/              # Custom React hooks
│   └── utils/              # Utility functions
├── types/                  # TypeScript interfaces
└── constants/              # Color scales, thresholds
```

## API Data Sources

All weather data is fetched from [Open-Meteo](https://open-meteo.com/), a free and open weather API:
- Geocoding API for location search
- Forecast API for multi-model predictions
- Minutely/hourly data for live radar animation

## Deployment

Deployed on [Railway](https://railway.app):
- **Production URL**: https://fish-production-dccf.up.railway.app
- Auto-deploys on push to `main` branch
- Uses Next.js standalone output for optimized container size

## License

MIT
