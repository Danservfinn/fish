'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Source, Layer, useMap } from 'react-map-gl/maplibre';
import type { RasterLayerSpecification } from 'maplibre-gl';
import type { PrecipMode } from '@/types/forecast';
import {
  fetchPrecipitationGrid,
  type PrecipitationGrid,
} from '@/lib/api/precipitation-grid';
import { renderPrecipitationImage } from '@/lib/utils/precipitation-raster';
import type { DataPoint } from '@/lib/utils/idw-interpolation';

interface PrecipitationLayerProps {
  mode: PrecipMode;
  days: number;
  model?: string;
  visible: boolean;
}

// Raster resolution for canvas rendering
const RASTER_WIDTH = 512;
const RASTER_HEIGHT = 512;

export default function PrecipitationLayer({
  mode,
  days,
  model = 'best_match',
  visible,
}: PrecipitationLayerProps) {
  const { current: map } = useMap();
  const [grid, setGrid] = useState<PrecipitationGrid | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bounds, setBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update bounds when map moves
  const updateBounds = useCallback(() => {
    if (!map) return;

    const mapBounds = map.getBounds();
    if (!mapBounds) return;

    setBounds({
      north: Math.min(mapBounds.getNorth(), 85),
      south: Math.max(mapBounds.getSouth(), -85),
      east: mapBounds.getEast(),
      west: mapBounds.getWest(),
    });
  }, [map]);

  // Listen to map move events
  useEffect(() => {
    if (!map) return;

    updateBounds();

    map.on('moveend', updateBounds);
    return () => {
      map.off('moveend', updateBounds);
    };
  }, [map, updateBounds]);

  // Fetch precipitation data when bounds or settings change
  useEffect(() => {
    if (!visible || !bounds) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPrecipitationGrid(bounds, days, model, mode);
        setGrid(data);
      } catch (error) {
        console.error('Failed to fetch precipitation grid:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce fetches
    const timeoutId = setTimeout(fetchData, 500);
    return () => clearTimeout(timeoutId);
  }, [bounds, days, model, mode, visible]);

  // Render image when grid data changes
  useEffect(() => {
    if (!grid || !bounds || grid.cells.length === 0) {
      setImageUrl(null);
      return;
    }

    // Clear any pending render
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    // Debounce rendering to avoid excessive canvas operations
    renderTimeoutRef.current = setTimeout(() => {
      try {
        // Convert grid cells to DataPoints for interpolation
        const points: DataPoint[] = grid.cells.map(cell => ({
          x: cell.lon,
          y: cell.lat,
          value: cell.value,
        }));

        // Render the interpolated image
        const url = renderPrecipitationImage(
          points,
          bounds,
          RASTER_WIDTH,
          RASTER_HEIGHT,
          mode
        );

        setImageUrl(url);
      } catch (error) {
        console.error('Failed to render precipitation image:', error);
      }
    }, 100);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [grid, bounds, mode]);

  // Raster layer for rendering the image
  const rasterLayer: RasterLayerSpecification = {
    id: 'precipitation-raster',
    type: 'raster',
    source: 'precipitation-image',
    paint: {
      'raster-opacity': 0.85,
      'raster-fade-duration': 300,
    },
  };

  if (!visible) return null;

  return (
    <>
      {/* Precipitation raster overlay */}
      {imageUrl && bounds && (
        <Source
          id="precipitation-image"
          type="image"
          url={imageUrl}
          coordinates={[
            [bounds.west, bounds.north], // top-left
            [bounds.east, bounds.north], // top-right
            [bounds.east, bounds.south], // bottom-right
            [bounds.west, bounds.south], // bottom-left
          ]}
        >
          <Layer {...rasterLayer} />
        </Source>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs text-white/80 font-medium tracking-wide">
              Loading precipitation data...
            </span>
          </div>
        </div>
      )}
    </>
  );
}
