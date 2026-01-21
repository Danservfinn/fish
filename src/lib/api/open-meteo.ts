import type { ModelForecast, DailyData, Location, ForecastResponse, ModelName } from '@/types/forecast';
import { calculateAgreement } from '@/lib/utils/agreement';
import { fetchAIFS } from './aifs';

const API_BASE = 'https://api.open-meteo.com/v1';

interface OpenMeteoDaily {
  time: string[];
  snowfall_sum?: number[];
  precipitation_sum?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone?: string;
  daily?: OpenMeteoDaily;
}

function parseDailyData(response: OpenMeteoResponse): DailyData[] {
  const daily = response.daily;
  if (!daily || !daily.time) return [];

  return daily.time.map((date, i) => ({
    date,
    snowfallSum: daily.snowfall_sum?.[i] ?? null,
    precipitationSum: daily.precipitation_sum?.[i] ?? null,
    tempMax: daily.temperature_2m_max?.[i] ?? null,
    tempMin: daily.temperature_2m_min?.[i] ?? null,
  }));
}

// Traditional models
async function fetchModel(
  model: 'ecmwf' | 'gfs' | 'icon',
  lat: number,
  lon: number,
  days: number = 7
): Promise<ModelForecast | null> {
  try {
    let url: string;

    switch (model) {
      case 'ecmwf':
        url = `${API_BASE}/ecmwf?latitude=${lat}&longitude=${lon}&daily=snowfall_sum,precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=${Math.min(days, 15)}`;
        break;
      case 'gfs':
        url = `${API_BASE}/gfs?latitude=${lat}&longitude=${lon}&daily=snowfall_sum,precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=${Math.min(days, 16)}`;
        break;
      case 'icon':
        url = `${API_BASE}/forecast?latitude=${lat}&longitude=${lon}&models=icon_seamless&daily=snowfall_sum,precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=${Math.min(days, 7)}`;
        break;
    }

    const response = await fetch(url);
    if (!response.ok) return null;

    const data: OpenMeteoResponse = await response.json();

    return {
      model,
      daily: parseDailyData(data),
      lastUpdated: new Date().toISOString(),
      forecastHorizon: model === 'ecmwf' ? 15 : model === 'gfs' ? 16 : 7,
    };
  } catch (error) {
    console.error(`Error fetching ${model}:`, error);
    return null;
  }
}

// GraphCast (Google DeepMind AI model)
async function fetchGraphCast(lat: number, lon: number, days: number = 7): Promise<ModelForecast | null> {
  try {
    const url = `${API_BASE}/forecast?latitude=${lat}&longitude=${lon}&models=gfs_graphcast025&daily=snowfall_sum,precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=${Math.min(days, 10)}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data: OpenMeteoResponse = await response.json();

    return {
      model: 'graphcast' as ModelName,
      daily: parseDailyData(data),
      lastUpdated: new Date().toISOString(),
      forecastHorizon: 10,
    };
  } catch (error) {
    console.error('Error fetching GraphCast:', error);
    return null;
  }
}

// NBM (National Blend of Models) - US only
async function fetchNBM(lat: number, lon: number, days: number = 7): Promise<ModelForecast | null> {
  // NBM is US-only, check bounds roughly
  if (lat < 20 || lat > 55 || lon < -135 || lon > -60) {
    return null;
  }

  try {
    const url = `${API_BASE}/forecast?latitude=${lat}&longitude=${lon}&models=ncep_nbm_conus&daily=snowfall_sum,precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=${Math.min(days, 10)}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data: OpenMeteoResponse = await response.json();

    return {
      model: 'nbm' as ModelName,
      daily: parseDailyData(data),
      lastUpdated: new Date().toISOString(),
      forecastHorizon: 10,
    };
  } catch (error) {
    console.error('Error fetching NBM:', error);
    return null;
  }
}

// HRRR (High-Resolution Rapid Refresh) - US only
async function fetchHRRR(lat: number, lon: number): Promise<ModelForecast | null> {
  // HRRR is US-only, check bounds roughly
  if (lat < 20 || lat > 55 || lon < -135 || lon > -60) {
    return null;
  }

  try {
    const url = `${API_BASE}/gfs?latitude=${lat}&longitude=${lon}&models=gfs_hrrr&daily=snowfall_sum,precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data: OpenMeteoResponse = await response.json();

    return {
      model: 'hrrr',
      daily: parseDailyData(data),
      lastUpdated: new Date().toISOString(),
      forecastHorizon: 2,
    };
  } catch (error) {
    console.error('Error fetching HRRR:', error);
    return null;
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<Location> {
  // Try to get location name from Open-Meteo geocoding (reverse not supported, so use coordinates)
  return {
    name: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
    lat,
    lon,
  };
}

export async function fetchAllModels(lat: number, lon: number, days: number = 7): Promise<ForecastResponse> {
  // Fetch all models in parallel (including AIFS from microservice)
  const [ecmwf, gfs, graphcast, nbm, hrrr, icon, ecmwf_aifs] = await Promise.all([
    fetchModel('ecmwf', lat, lon, days),
    fetchModel('gfs', lat, lon, days),
    fetchGraphCast(lat, lon, days),
    fetchNBM(lat, lon, days),
    fetchHRRR(lat, lon),
    fetchModel('icon', lat, lon, days),
    fetchAIFS(lat, lon, days),
  ]);

  // Get location info
  const location = await reverseGeocode(lat, lon);

  // Calculate agreement
  const validModels = [ecmwf, gfs, graphcast, nbm, hrrr, icon, ecmwf_aifs].filter((m): m is ModelForecast => m !== null);
  const agreement = calculateAgreement(validModels);

  // Calculate snow timing (simplified)
  let snowStart: string | null = null;
  let snowPeak: string | null = null;
  let snowEnd: string | null = null;

  // Use ECMWF as primary for timing
  if (ecmwf) {
    const snowDays = ecmwf.daily.filter(d => (d.snowfallSum ?? 0) > 0);
    if (snowDays.length > 0) {
      snowStart = snowDays[0].date;
      snowEnd = snowDays[snowDays.length - 1].date;

      // Find peak day
      const peakDay = snowDays.reduce((max, d) =>
        (d.snowfallSum ?? 0) > (max.snowfallSum ?? 0) ? d : max
      );
      snowPeak = peakDay.date;
    }
  }

  // Calculate total ranges
  const snowTotals = validModels.map(m =>
    m.daily.reduce((sum, d) => sum + (d.snowfallSum ?? 0), 0)
  );
  const precipTotals = validModels.map(m =>
    m.daily.reduce((sum, d) => sum + (d.precipitationSum ?? 0), 0)
  );

  return {
    location,
    generated: new Date().toISOString(),
    models: { ecmwf, gfs, graphcast, nbm, hrrr, icon, ecmwf_aifs },
    summary: {
      agreement,
      snowStart,
      snowPeak,
      snowEnd,
      totalSnowRange: snowTotals.length > 0
        ? [Math.min(...snowTotals), Math.max(...snowTotals)] as [number, number]
        : [0, 0],
      totalPrecipRange: precipTotals.length > 0
        ? [Math.min(...precipTotals), Math.max(...precipTotals)] as [number, number]
        : [0, 0],
    },
  };
}

// Helper to get color for precipitation amount
export function getPrecipColor(amount: number, type: 'rain' | 'snow'): string {
  const colors = type === 'snow'
    ? [
        { min: 0, max: 0.1, color: 'transparent' },
        { min: 0.1, max: 1, color: '#F0F8FF' },
        { min: 1, max: 3, color: '#ADD8E6' },
        { min: 3, max: 6, color: '#87CEEB' },
        { min: 6, max: 12, color: '#4169E1' },
        { min: 12, max: 18, color: '#0000CD' },
        { min: 18, max: Infinity, color: '#00008B' },
      ]
    : [
        { min: 0, max: 0.01, color: 'transparent' },
        { min: 0.01, max: 0.25, color: '#E0FFE0' },
        { min: 0.25, max: 0.5, color: '#98FB98' },
        { min: 0.5, max: 1, color: '#32CD32' },
        { min: 1, max: 2, color: '#228B22' },
        { min: 2, max: 4, color: '#006400' },
        { min: 4, max: Infinity, color: '#004D00' },
      ];

  const match = colors.find(c => amount >= c.min && amount < c.max);
  return match?.color ?? 'transparent';
}
