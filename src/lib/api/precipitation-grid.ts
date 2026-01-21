import type { PrecipMode } from '@/types/forecast';

export interface GridCell {
  lat: number;
  lon: number;
  value: number;
  model: string;
}

export interface PrecipitationGrid {
  cells: GridCell[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  resolution: number;
  model: string;
  generated: string;
}

const API_BASE = 'https://api.open-meteo.com/v1';

// Fetch precipitation data for a grid of points
export async function fetchPrecipitationGrid(
  bounds: { north: number; south: number; east: number; west: number },
  days: number = 7,
  model: string = 'best_match',
  mode: PrecipMode = 'snow'
): Promise<PrecipitationGrid> {
  // Calculate grid resolution based on area size
  const latSpan = bounds.north - bounds.south;
  const lonSpan = bounds.east - bounds.west;

  // Adaptive resolution: fewer points for larger areas
  let resolution: number;
  if (latSpan > 20 || lonSpan > 30) {
    resolution = 2; // ~222km cells for continent view
  } else if (latSpan > 10 || lonSpan > 15) {
    resolution = 1; // ~111km cells for region view
  } else if (latSpan > 5 || lonSpan > 7) {
    resolution = 0.5; // ~55km cells for state view
  } else {
    resolution = 0.25; // ~28km cells for local view
  }

  // Generate grid points
  const latPoints: number[] = [];
  const lonPoints: number[] = [];

  for (let lat = bounds.south; lat <= bounds.north; lat += resolution) {
    latPoints.push(Math.round(lat * 100) / 100);
  }
  for (let lon = bounds.west; lon <= bounds.east; lon += resolution) {
    lonPoints.push(Math.round(lon * 100) / 100);
  }

  // Limit to reasonable number of API calls (max ~100 points)
  const maxPoints = 100;
  const totalPoints = latPoints.length * lonPoints.length;

  if (totalPoints > maxPoints) {
    // Increase resolution to reduce points
    const factor = Math.ceil(Math.sqrt(totalPoints / maxPoints));
    const newLatPoints = latPoints.filter((_, i) => i % factor === 0);
    const newLonPoints = lonPoints.filter((_, i) => i % factor === 0);
    latPoints.length = 0;
    lonPoints.length = 0;
    latPoints.push(...newLatPoints);
    lonPoints.push(...newLonPoints);
  }

  // Fetch data for all grid points in parallel (batched)
  const cells: GridCell[] = [];
  const batchSize = 10;

  const allCoords: Array<{ lat: number; lon: number }> = [];
  for (const lat of latPoints) {
    for (const lon of lonPoints) {
      allCoords.push({ lat, lon });
    }
  }

  // Process in batches
  for (let i = 0; i < allCoords.length; i += batchSize) {
    const batch = allCoords.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async ({ lat, lon }) => {
        try {
          const modelParam = model === 'best_match' ? '' : `&models=${model}`;
          const url = `${API_BASE}/forecast?latitude=${lat}&longitude=${lon}&daily=snowfall_sum,precipitation_sum&timezone=auto&forecast_days=${days}${modelParam}`;

          const response = await fetch(url);
          if (!response.ok) return null;

          const data = await response.json();
          const daily = data.daily;

          if (!daily) return null;

          // Sum up the values for the period
          let total = 0;
          if (mode === 'snow' && daily.snowfall_sum) {
            total = daily.snowfall_sum.reduce((sum: number, val: number | null) => sum + (val ?? 0), 0);
          } else if (mode === 'rain' && daily.precipitation_sum) {
            total = daily.precipitation_sum.reduce((sum: number, val: number | null) => sum + (val ?? 0), 0);
          } else if (mode === 'total' && daily.precipitation_sum) {
            total = daily.precipitation_sum.reduce((sum: number, val: number | null) => sum + (val ?? 0), 0);
          }

          // Convert cm to inches for snow
          if (mode === 'snow') {
            total = total * 0.3937; // cm to inches
          } else {
            total = total / 25.4; // mm to inches
          }

          return { lat, lon, value: total, model };
        } catch {
          return null;
        }
      })
    );

    cells.push(...results.filter((r): r is GridCell => r !== null));
  }

  return {
    cells,
    bounds,
    resolution,
    model,
    generated: new Date().toISOString(),
  };
}

// Color scales for precipitation visualization
export const SNOW_COLOR_SCALE = [
  { min: 0, max: 0.1, color: 'rgba(0, 0, 0, 0)', label: 'None' },
  { min: 0.1, max: 1, color: 'rgba(200, 220, 255, 0.4)', label: 'Trace' },
  { min: 1, max: 3, color: 'rgba(150, 200, 255, 0.5)', label: '1-3"' },
  { min: 3, max: 6, color: 'rgba(100, 170, 255, 0.6)', label: '3-6"' },
  { min: 6, max: 12, color: 'rgba(65, 105, 225, 0.7)', label: '6-12"' },
  { min: 12, max: 18, color: 'rgba(75, 0, 130, 0.75)', label: '12-18"' },
  { min: 18, max: 24, color: 'rgba(138, 43, 226, 0.8)', label: '18-24"' },
  { min: 24, max: Infinity, color: 'rgba(255, 20, 147, 0.85)', label: '24"+' },
];

export const RAIN_COLOR_SCALE = [
  { min: 0, max: 0.01, color: 'rgba(0, 0, 0, 0)', label: 'None' },
  { min: 0.01, max: 0.1, color: 'rgba(200, 255, 200, 0.3)', label: 'Trace' },
  { min: 0.1, max: 0.25, color: 'rgba(150, 255, 150, 0.4)', label: '0.1-0.25"' },
  { min: 0.25, max: 0.5, color: 'rgba(100, 220, 100, 0.5)', label: '0.25-0.5"' },
  { min: 0.5, max: 1, color: 'rgba(50, 205, 50, 0.6)', label: '0.5-1"' },
  { min: 1, max: 2, color: 'rgba(255, 215, 0, 0.65)', label: '1-2"' },
  { min: 2, max: 4, color: 'rgba(255, 140, 0, 0.7)', label: '2-4"' },
  { min: 4, max: Infinity, color: 'rgba(255, 0, 0, 0.8)', label: '4"+' },
];

export function getColorForValue(value: number, mode: PrecipMode): string {
  const scale = mode === 'snow' ? SNOW_COLOR_SCALE : RAIN_COLOR_SCALE;
  const match = scale.find(s => value >= s.min && value < s.max);
  return match?.color ?? 'rgba(0, 0, 0, 0)';
}

export function getLabelForValue(value: number, mode: PrecipMode): string {
  const scale = mode === 'snow' ? SNOW_COLOR_SCALE : RAIN_COLOR_SCALE;
  const match = scale.find(s => value >= s.min && value < s.max);
  return match?.label ?? 'None';
}
