import type { ModelForecast, DailyData, Location, ForecastResponse } from '@/types/forecast';
import { calculateAgreement } from '@/lib/utils/agreement';

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
  // Open-Meteo doesn't have reverse geocoding, just return coordinates
  return {
    name: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
    lat,
    lon,
  };
}

export async function fetchAllModels(lat: number, lon: number): Promise<ForecastResponse> {
  // Fetch all models in parallel
  const [ecmwf, gfs, hrrr, icon] = await Promise.all([
    fetchModel('ecmwf', lat, lon),
    fetchModel('gfs', lat, lon),
    fetchHRRR(lat, lon),
    fetchModel('icon', lat, lon),
  ]);

  // Get location info
  const location = await reverseGeocode(lat, lon);

  // Calculate agreement
  const validModels = [ecmwf, gfs, hrrr, icon].filter((m): m is ModelForecast => m !== null);
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
    models: { ecmwf, gfs, hrrr, icon },
    summary: {
      agreement,
      snowStart,
      snowPeak,
      snowEnd,
      totalSnowRange: [Math.min(...snowTotals), Math.max(...snowTotals)] as [number, number],
      totalPrecipRange: [Math.min(...precipTotals), Math.max(...precipTotals)] as [number, number],
    },
  };
}
