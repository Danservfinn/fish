'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { GridConfig } from '@/types/precipitation';
import { calculateGrid } from '@/lib/utils/precipitation';
import { API_CONFIG } from '@/constants/precipitation';

interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface UseViewportGridReturn {
  grid: GridConfig | null;
  isCalculating: boolean;
  updateGrid: (bounds: ViewportBounds, zoom: number) => void;
}

export function useViewportGrid(): UseViewportGridReturn {
  const [grid, setGrid] = useState<GridConfig | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<{ bounds: ViewportBounds; zoom: number } | null>(null);

  const updateGrid = useCallback((bounds: ViewportBounds, zoom: number) => {
    // Store the latest values
    lastUpdateRef.current = { bounds, zoom };

    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Debounce the calculation
    debounceTimeout.current = setTimeout(() => {
      setIsCalculating(true);

      // Use the latest stored values
      const latest = lastUpdateRef.current;
      if (!latest) return;

      const newGrid = calculateGrid(latest.bounds, latest.zoom);
      setGrid(newGrid);
      setIsCalculating(false);
    }, API_CONFIG.debounceMs);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return { grid, isCalculating, updateGrid };
}
