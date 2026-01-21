'use client';

import { Source, Layer } from 'react-map-gl/maplibre';
import type { LayerProps } from 'react-map-gl/maplibre';
import type { PrecipitationGeoJSON, RadarLayerState } from '@/types/precipitation';

interface RadarOverlayProps {
  data: PrecipitationGeoJSON | null;
  opacity: number;
  layers: RadarLayerState;
  isVisible: boolean;
}

export default function RadarOverlay({
  data,
  opacity,
  layers,
  isVisible,
}: RadarOverlayProps) {
  if (!isVisible || !data) return null;

  // Precipitation intensity layer (filled circles)
  const intensityLayer: LayerProps = {
    id: 'precipitation-fill',
    type: 'circle',
    source: 'precipitation-data',
    filter: ['>', ['get', 'rate'], 0.1],
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, 10,
        8, 18,
        12, 28,
      ],
      'circle-color': ['get', 'color'],
      'circle-opacity': [
        '*',
        opacity,
        ['get', 'opacity'],
      ],
      'circle-blur': 0.4,
    },
  };

  // Precipitation type layer (icons as text for simplicity)
  // Using text layer with emojis instead of custom icons
  const typeLayer: LayerProps = {
    id: 'precipitation-type',
    type: 'symbol',
    source: 'precipitation-data',
    filter: ['all',
      ['!=', ['get', 'type'], 'none'],
      ['>', ['get', 'rate'], 0.5],
    ],
    layout: {
      'text-field': [
        'match',
        ['get', 'type'],
        'rain', '💧',
        'snow', '❄️',
        'freezing_rain', '🧊',
        'showers', '🌧️',
        'thunderstorm', '⛈️',
        '',
      ],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, 10,
        8, 14,
        12, 18,
      ],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-opacity': opacity,
    },
  };

  // Movement indicator layer (arrows using text)
  const movementLayer: LayerProps = {
    id: 'precipitation-movement',
    type: 'symbol',
    source: 'precipitation-data',
    filter: ['all',
      ['has', 'movementAngle'],
      ['>', ['get', 'movementSpeed'], 5],
    ],
    layout: {
      'text-field': '→',
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, 12,
        8, 16,
        12, 20,
      ],
      'text-rotate': ['get', 'movementAngle'],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': '#ffffff',
      'text-opacity': opacity * 0.8,
      'text-halo-color': '#000000',
      'text-halo-width': 1,
    },
  };

  return (
    <Source
      id="precipitation-data"
      type="geojson"
      data={data}
    >
      {layers.intensity && <Layer {...intensityLayer} />}
      {layers.type && <Layer {...typeLayer} />}
      {layers.movement && <Layer {...movementLayer} />}
    </Source>
  );
}
