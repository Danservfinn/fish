'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PRECIPITATION_COLORS, PRECIPITATION_LABELS } from '@/constants/precipitation';

interface RadarLegendProps {
  isVisible: boolean;
}

export default function RadarLegend({ isVisible }: RadarLegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) return null;

  const colorEntries = [
    { key: 'extreme', color: PRECIPITATION_COLORS.extreme },
    { key: 'veryHeavy', color: PRECIPITATION_COLORS.veryHeavy },
    { key: 'heavy', color: PRECIPITATION_COLORS.heavy },
    { key: 'moderate', color: PRECIPITATION_COLORS.moderate },
    { key: 'light', color: PRECIPITATION_COLORS.light },
  ];

  return (
    <div
      className="
        rounded-xl overflow-hidden
        bg-card/95 dark:bg-card/90
        backdrop-blur-xl
        border border-border/50
        shadow-lg shadow-black/5 dark:shadow-black/20
      "
    >
      <div className="p-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Precipitation (mm/hr)
          </span>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="
              w-6 h-6 rounded-md
              flex items-center justify-center
              hover:bg-muted/50
              transition-colors
            "
          >
            {isCollapsed ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>

        {!isCollapsed && (
          <div className="space-y-1.5">
            {colorEntries.map(({ key, color }) => (
              <div key={key} className="flex items-center gap-2.5">
                <div
                  className="w-5 h-3.5 rounded-sm"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 1px 2px ${color}40`,
                  }}
                />
                <span className="font-data text-[11px] text-foreground/80">
                  {PRECIPITATION_LABELS[key]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
