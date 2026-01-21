/**
 * AIFS API Client
 *
 * Fetches ECMWF AIFS (AI Forecast System) data from the Python microservice.
 * Falls back gracefully if the service is unavailable.
 */

import type { ModelForecast, DailyData, ModelName } from '@/types/forecast';

// AIFS service URL - set via environment variable or default to localhost for dev
const AIFS_SERVICE_URL =
  process.env.NEXT_PUBLIC_AIFS_URL || 'http://localhost:8000';

interface AIFSDailyData {
  date: string;
  snowfall_sum: number | null;
  precipitation_sum: number | null;
  temp_max: number | null;
  temp_min: number | null;
}

interface AIFSResponse {
  lat: number;
  lon: number;
  model: string;
  daily: AIFSDailyData[];
  last_updated: string;
  forecast_horizon: number;
}

/**
 * Fetch AIFS forecast for a location.
 *
 * @param lat Latitude
 * @param lon Longitude
 * @param days Number of forecast days (max 10)
 * @returns ModelForecast or null if unavailable
 */
export async function fetchAIFS(
  lat: number,
  lon: number,
  days: number = 10
): Promise<ModelForecast | null> {
  try {
    const url = `${AIFS_SERVICE_URL}/forecast/${lat}/${lon}?days=${Math.min(days, 10)}`;

    const response = await fetch(url, {
      // 10 second timeout - AIFS service may need to process GRIB data
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`AIFS service returned ${response.status}`);
      return null;
    }

    const data: AIFSResponse = await response.json();

    // Convert AIFS response to Fish app's DailyData format
    const daily: DailyData[] = data.daily.map((d) => ({
      date: d.date,
      snowfallSum: d.snowfall_sum,
      precipitationSum: d.precipitation_sum,
      tempMax: d.temp_max,
      tempMin: d.temp_min,
    }));

    return {
      model: 'ecmwf_aifs' as ModelName,
      daily,
      lastUpdated: data.last_updated,
      forecastHorizon: data.forecast_horizon,
    };
  } catch (error) {
    // Log but don't throw - AIFS is optional
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        console.warn('AIFS service timeout');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('AIFS service unavailable');
      } else {
        console.warn('Error fetching AIFS:', error.message);
      }
    }
    return null;
  }
}

/**
 * Check if the AIFS service is available.
 */
export async function checkAIFSHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${AIFS_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
