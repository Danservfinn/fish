'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Source, Layer, useMap } from 'react-map-gl/maplibre';
import type { FillLayerSpecification, LineLayerSpecification } from 'maplibre-gl';
import type { PrecipMode } from '@/types/forecast';
import {
  fetchPrecipitationGrid,
  getColorForValue,
  type PrecipitationGrid,
} from '@/lib/api/precipitation-grid';

interface PrecipitationLayerProps {
  mode: PrecipMode;
  days: number;
  model?: string;
  visible: boolean;
}

// Create a GeoJSON feature for a grid cell
function createCellFeature(
  lat: number,
  lon: number,
  value: number,
  resolution: number,
  mode: PrecipMode
) {
  const halfRes = resolution / 2;
  const color = getColorForValue(value, mode);

  return {
    type: 'Feature' as const,
    properties: {
      value,
      color,
      lat,
      lon,
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [[
        [lon - halfRes, lat - halfRes],
        [lon + halfRes, lat - halfRes],
        [lon + halfRes, lat + halfRes],
        [lon - halfRes, lat + halfRes],
        [lon - halfRes, lat - halfRes],
      ]],
    },
  };
}

export default function PrecipitationLayer({
  mode,
  days,
  model = 'best_match',
  visible,
}: PrecipitationLayerProps) {
  const { current: map } = useMap();
  const [grid, setGrid] = useState<PrecipitationGrid | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bounds, setBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

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

  // Generate GeoJSON from grid data
  const geojsonData = useMemo(() => {
    if (!grid) {
      return { type: 'FeatureCollection' as const, features: [] };
    }

    const features = grid.cells
      .filter(cell => cell.value > (mode === 'snow' ? 0.1 : 0.01))
      .map(cell =>
        createCellFeature(cell.lat, cell.lon, cell.value, grid.resolution, mode)
      );

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [grid, mode]);

  const fillLayer: FillLayerSpecification = {
    id: 'precipitation-fill',
    type: 'fill',
    source: 'precipitation',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        3, 0.6,
        6, 0.7,
        10, 0.8,
      ],
    },
  };

  const outlineLayer: LineLayerSpecification = {
    id: 'precipitation-outline',
    type: 'line',
    source: 'precipitation',
    paint: {
      'line-color': ['get', 'color'],
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        3, 0,
        8, 0.5,
        12, 1,
      ],
      'line-opacity': 0.3,
    },
  };

  if (!visible) return null;

  return (
    <>
      <Source id="precipitation" type="geojson" data={geojsonData}>
        <Layer {...fillLayer} />
        <Layer {...outlineLayer} />
      </Source>

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
