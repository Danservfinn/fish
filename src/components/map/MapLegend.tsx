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
        className="rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15,15,20,0.95) 0%, rgba(25,25,35,0.9) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-2.5 border-b"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            background: mode === 'snow'
              ? 'linear-gradient(90deg, rgba(100,149,237,0.15) 0%, rgba(138,43,226,0.1) 100%)'
              : 'linear-gradient(90deg, rgba(50,205,50,0.15) 0%, rgba(255,140,0,0.1) 100%)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{mode === 'snow' ? '❄️' : '💧'}</span>
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{
                background: mode === 'snow'
                  ? 'linear-gradient(90deg, #93c5fd, #c4b5fd)'
                  : 'linear-gradient(90deg, #86efac, #fcd34d)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {mode === 'snow' ? 'Snowfall' : mode === 'rain' ? 'Rainfall' : 'Precipitation'}
            </span>
          </div>
          <div className="text-[10px] text-white/40 mt-0.5 tracking-wide">
            7-Day Accumulation (inches)
          </div>
        </div>

        {/* Color scale */}
        <div className="p-3 space-y-1">
          {filteredScale.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 group">
              <div
                className="w-6 h-4 rounded-sm shadow-inner transition-transform group-hover:scale-110"
                style={{
                  background: item.color,
                  boxShadow: `0 0 8px ${item.color}, inset 0 1px 2px rgba(255,255,255,0.1)`,
                }}
              />
              <span className="text-[11px] text-white/70 font-medium tabular-nums tracking-wide">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-3 py-2 text-[9px] text-white/30 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.04)' }}
        >
          Data: Open-Meteo • Updated live
        </div>
      </div>
    </div>
  );
}
