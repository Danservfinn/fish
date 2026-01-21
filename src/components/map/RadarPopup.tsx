'use client';

import { Popup } from 'react-map-gl/maplibre';
import type { PrecipitationProperties } from '@/types/precipitation';
import { PRECIPITATION_TYPE_INFO } from '@/constants/precipitation';
import { formatPrecipitationRate } from '@/lib/utils/precipitation';

interface RadarPopupProps {
  longitude: number;
  latitude: number;
  properties: PrecipitationProperties;
  onClose: () => void;
}

export default function RadarPopup({
  longitude,
  latitude,
  properties,
  onClose,
}: RadarPopupProps) {
  const typeInfo = PRECIPITATION_TYPE_INFO[properties.type];

  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      anchor="bottom"
      onClose={onClose}
      closeButton={true}
      closeOnClick={false}
      className="radar-popup"
    >
      <div className="p-2 min-w-[180px]">
        {/* Header with type */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{typeInfo.icon}</span>
          <span className="font-medium">{typeInfo.label}</span>
        </div>

        {/* Current precipitation */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current:</span>
            <span className="font-medium">
              {formatPrecipitationRate(properties.rate)}
            </span>
          </div>

          {/* Next hour forecast */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Next hour:</span>
            <span className="font-medium">
              {formatPrecipitationRate(properties.nextHourForecast)}
            </span>
          </div>

          {/* Model source */}
          <div className="flex justify-between pt-1 mt-1 border-t border-border/50">
            <span className="text-muted-foreground">Model:</span>
            <span className="text-xs font-mono">
              {properties.model === 'nbm' ? 'NBM (US)' : 'ECMWF'}
            </span>
          </div>
        </div>

        {/* Intensity indicator */}
        <div className="mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: properties.color }}
            />
            <span className="text-xs text-muted-foreground">
              {properties.rate < 0.1
                ? 'No precipitation'
                : properties.rate < 2.5
                  ? 'Light'
                  : properties.rate < 7.5
                    ? 'Moderate'
                    : properties.rate < 15
                      ? 'Heavy'
                      : properties.rate < 30
                        ? 'Very Heavy'
                        : 'Extreme'}
            </span>
          </div>
        </div>
      </div>
    </Popup>
  );
}
