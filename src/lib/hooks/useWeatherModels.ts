'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAllModels } from '@/lib/api/open-meteo';
import type { ForecastResponse } from '@/types/forecast';

interface UseWeatherModelsResult {
  data: ForecastResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Simple in-memory cache
const cache = new Map<string, { data: ForecastResponse; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCacheKey(lat: number, lon: number): string {
  // Round to 0.1 degree for cache efficiency
  return `${Math.round(lat * 10) / 10},${Math.round(lon * 10) / 10}`;
}

export function useWeatherModels(lat: number, lon: number): UseWeatherModelsResult {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    const cacheKey = getCacheKey(lat, lon);

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchAllModels(lat, lon);
      setData(result);

      // Update cache
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch weather data'));
    } finally {
      setIsLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
