'use client';

import { SNOW_COLOR_SCALE, RAIN_COLOR_SCALE } from '@/lib/api/precipitation-grid';
import type { PrecipMode } from '@/types/forecast';

interface MapLegendProps {
  mode: PrecipMode;
  visible: boolean;
}

export default function MapLegend({ mode, visible }: MapLegendProps) {
  if (!visible) return null;

  const scale = mode === 'snow' ? SNOW_COLOR_SCALE : RAIN_COLOR_SCALE;
  const filteredScale = scale.filter(s => s.max !== 0 && s.min !== 0);

  return (
    <div className="absolute bottom-16 left-4 z-10">
      <div
        className="
          rounded-xl overflow-hidden
          bg-card/95 dark:bg-card/90
          backdrop-blur-xl
          border border-border/50
          shadow-lg shadow-black/5 dark:shadow-black/20
        "
      >
        {/* Header */}
        <div
          className={`
            px-4 py-2.5 border-b border-border/30
            ${mode === 'snow'
              ? 'bg-blue-500/5 dark:bg-blue-500/10'
              : 'bg-emerald-500/5 dark:bg-emerald-500/10'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{mode === 'snow' ? '❄️' : '💧'}</span>
            <span className={`
              text-xs font-semibold tracking-wider uppercase
              ${mode === 'snow'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-emerald-600 dark:text-emerald-400'
              }
            `}>
              {mode === 'snow' ? 'Snowfall' : mode === 'rain' ? 'Rainfall' : 'Precipitation'}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">
            7-Day Accumulation (inches)
          </div>
        </div>

        {/* Color scale */}
        <div className="p-3 space-y-1.5">
          {filteredScale.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 group">
              <div
                className="w-6 h-4 rounded-sm transition-transform group-hover:scale-105"
                style={{
                  background: item.color,
                  boxShadow: `0 1px 3px ${item.color}40`,
                }}
              />
              <span className="font-data text-[11px] text-foreground/80 font-medium tabular-nums tracking-wide">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 text-[9px] text-muted-foreground/70 border-t border-border/30">
          Data: Open-Meteo • Updated live
        </div>
      </div>
    </div>
  );
}
