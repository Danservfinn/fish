'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  PrecipitationCell,
  PrecipitationGeoJSON,
  GridConfig,
} from '@/types/precipitation';
import { fetchPrecipitationGrid } from '@/lib/api/precipitation';
import { buildPrecipitationGeoJSON } from '@/lib/utils/precipitation';
import { CACHE_CONFIG } from '@/constants/precipitation';

interface UsePrecipitationDataReturn {
  data: PrecipitationCell[];
  geoJSON: PrecipitationGeoJSON | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function usePrecipitationData(grid: GridConfig | null): UsePrecipitationDataReturn {
  const [data, setData] = useState<PrecipitationCell[]>([]);
  const [geoJSON, setGeoJSON] = useState<PrecipitationGeoJSON | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const currentGridRef = useRef<GridConfig | null>(null);

  const fetchData = useCallback(async (gridConfig: GridConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      const cells = await fetchPrecipitationGrid(gridConfig);
      setData(cells);
      setGeoJSON(buildPrecipitationGeoJSON(cells));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch precipitation data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data when grid changes
  useEffect(() => {
    if (!grid) return;

    currentGridRef.current = grid;
    fetchData(grid);
  }, [grid, fetchData]);

  // Set up auto-refresh
  useEffect(() => {
    if (!grid) return;

    // Clear existing interval
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }

    // Set up new refresh interval
    refreshInterval.current = setInterval(() => {
      const currentGrid = currentGridRef.current;
      if (currentGrid) {
        fetchData(currentGrid);
      }
    }, CACHE_CONFIG.refreshInterval);

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [grid, fetchData]);

  const refresh = useCallback(() => {
    const currentGrid = currentGridRef.current;
    if (currentGrid) {
      fetchData(currentGrid);
    }
  }, [fetchData]);

  return {
    data,
    geoJSON,
    isLoading,
    error,
    lastUpdated,
    refresh,
  };
}
