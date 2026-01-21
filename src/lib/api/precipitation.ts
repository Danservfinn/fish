import type {
  PrecipitationCell,
  PrecipitationModel,
  OpenMeteoPrecipitationResponse,
  CachedPrecipitationData,
  GridConfig,
} from '@/types/precipitation';
import {
  API_CONFIG,
  US_BOUNDS,
  CACHE_CONFIG,
} from '@/constants/precipitation';
import { getPrecipitationColor, getPrecipitationType } from '@/lib/utils/precipitation';

// In-memory cache for precipitation data
const precipitationCache = new Map<string, CachedPrecipitationData>();

function getCacheKey(lat: number, lon: number, resolution: number): string {
  const roundedLat = Math.round(lat / resolution) * resolution;
  const roundedLon = Math.round(lon / resolution) * resolution;
  return `${roundedLat.toFixed(2)},${roundedLon.toFixed(2)},${resolution}`;
}

function isUSLocation(lat: number, lon: number): boolean {
  return (
    lat >= US_BOUNDS.south &&
    lat <= US_BOUNDS.north &&
    lon >= US_BOUNDS.west &&
    lon <= US_BOUNDS.east
  );
}

function selectModel(lat: number, lon: number): PrecipitationModel {
  return isUSLocation(lat, lon) ? 'nbm' : 'ecmwf';
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function fetchPrecipitationBatch(
  points: Array<{ lat: number; lon: number }>
): Promise<Array<{ point: { lat: number; lon: number }; data: OpenMeteoPrecipitationResponse | null }>> {
  if (points.length === 0) return [];

  // Group points by model (US vs international)
  const usPoints = points.filter(p => isUSLocation(p.lat, p.lon));
  const intlPoints = points.filter(p => !isUSLocation(p.lat, p.lon));

  const results: Array<{ point: { lat: number; lon: number }; data: OpenMeteoPrecipitationResponse | null }> = [];

  // Fetch US points with NBM model
  if (usPoints.length > 0) {
    const batches = chunk(usPoints, API_CONFIG.batchSize);
    for (const batch of batches) {
      try {
        const lats = batch.map(p => p.lat.toFixed(4)).join(',');
        const lons = batch.map(p => p.lon.toFixed(4)).join(',');

        const url = `${API_CONFIG.baseUrl}/forecast?` +
          `latitude=${lats}&longitude=${lons}` +
          `&models=nbm_conus` +
          `&current=precipitation,rain,snowfall,weather_code` +
          `&minutely_15=precipitation,rain,snowfall` +
          `&hourly=precipitation,weather_code` +
          `&forecast_hours=1` +
          `&timezone=auto`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          // Handle both single and multiple responses
          const responses = Array.isArray(data) ? data : [data];
          batch.forEach((point, i) => {
            results.push({ point, data: responses[i] || null });
          });
        } else {
          batch.forEach(point => results.push({ point, data: null }));
        }
      } catch (error) {
        console.error('Error fetching US precipitation batch:', error);
        batch.forEach(point => results.push({ point, data: null }));
      }
    }
  }

  // Fetch international points with ECMWF
  if (intlPoints.length > 0) {
    const batches = chunk(intlPoints, API_CONFIG.batchSize);
    for (const batch of batches) {
      try {
        const lats = batch.map(p => p.lat.toFixed(4)).join(',');
        const lons = batch.map(p => p.lon.toFixed(4)).join(',');

        const url = `${API_CONFIG.baseUrl}/forecast?` +
          `latitude=${lats}&longitude=${lons}` +
          `&models=ecmwf_ifs025` +
          `&current=precipitation,rain,snowfall,weather_code` +
          `&minutely_15=precipitation,rain,snowfall` +
          `&hourly=precipitation,weather_code` +
          `&forecast_hours=1` +
          `&timezone=auto`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const responses = Array.isArray(data) ? data : [data];
          batch.forEach((point, i) => {
            results.push({ point, data: responses[i] || null });
          });
        } else {
          batch.forEach(point => results.push({ point, data: null }));
        }
      } catch (error) {
        console.error('Error fetching international precipitation batch:', error);
        batch.forEach(point => results.push({ point, data: null }));
      }
    }
  }

  return results;
}

function parseResponse(
  point: { lat: number; lon: number },
  response: OpenMeteoPrecipitationResponse
): CachedPrecipitationData {
  const current = response.current;
  const rate = current?.precipitation ?? current?.rain ?? current?.snowfall ?? 0;
  const weatherCode = current?.weather_code ?? 0;
  const type = getPrecipitationType(weatherCode);
  const color = getPrecipitationColor(rate);
  const model = selectModel(point.lat, point.lon);

  // Get next hour forecast from hourly data
  const nextHourForecast = response.hourly?.precipitation?.[0] ?? rate;

  // Build minutely_15 data for animation frames
  const minutely15 = response.minutely_15?.time?.map((time, i) => ({
    time,
    rate: response.minutely_15?.precipitation?.[i] ?? 0,
  })) ?? [];

  return {
    data: {
      lat: point.lat,
      lon: point.lon,
      rate,
      type,
      weatherCode,
      color,
      model,
      nextHourForecast,
    },
    timestamp: Date.now(),
    minutely15,
  };
}

export async function fetchPrecipitationGrid(
  grid: GridConfig
): Promise<PrecipitationCell[]> {
  const now = Date.now();
  const results: PrecipitationCell[] = [];
  const pointsToFetch: Array<{ lat: number; lon: number }> = [];

  // Check cache for each point
  for (const point of grid.points) {
    const cacheKey = getCacheKey(point.lat, point.lon, grid.resolution);
    const cached = precipitationCache.get(cacheKey);

    if (cached && now - cached.timestamp < CACHE_CONFIG.ttl) {
      results.push(cached.data);
    } else {
      pointsToFetch.push(point);
    }
  }

  // Fetch missing points
  if (pointsToFetch.length > 0) {
    const fetchedData = await fetchPrecipitationBatch(pointsToFetch);

    for (const { point, data } of fetchedData) {
      if (data) {
        const parsed = parseResponse(point, data);
        const cacheKey = getCacheKey(point.lat, point.lon, grid.resolution);
        precipitationCache.set(cacheKey, parsed);
        results.push(parsed.data);
      }
    }

    // Prune cache if too large
    if (precipitationCache.size > CACHE_CONFIG.maxCacheSize) {
      const entries = Array.from(precipitationCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, entries.length - CACHE_CONFIG.maxCacheSize);
      toDelete.forEach(([key]) => precipitationCache.delete(key));
    }
  }

  return results;
}

export function getCachedMinutely15(
  lat: number,
  lon: number,
  resolution: number
): Array<{ time: string; rate: number }> | null {
  const cacheKey = getCacheKey(lat, lon, resolution);
  const cached = precipitationCache.get(cacheKey);
  return cached?.minutely15 ?? null;
}

export function clearPrecipitationCache(): void {
  precipitationCache.clear();
}
