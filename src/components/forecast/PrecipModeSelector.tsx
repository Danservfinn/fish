'use client';

import type { PrecipMode } from '@/types/forecast';
import { Droplets } from 'lucide-react';

interface PrecipModeSelectorProps {
  value: PrecipMode;
  onChange: (value: PrecipMode) => void;
}

const modes: { value: PrecipMode; label: string; emoji: string }[] = [
  { value: 'snow', label: 'Snow', emoji: '❄️' },
  { value: 'rain', label: 'Rain', emoji: '💧' },
  { value: 'total', label: 'Total', emoji: '🌧️' },
];

export default function PrecipModeSelector({ value, onChange }: PrecipModeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Droplets className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-wider font-medium">Type</span>
      </div>
      <div
        className="
          flex-1 flex gap-1 p-1
          rounded-lg
          bg-muted/40
          border border-border/30
        "
      >
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={`
              flex-1 flex items-center justify-center gap-1.5
              px-3 py-2 rounded-md
              text-xs font-medium
              transition-all duration-200
              ${value === mode.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }
            `}
          >
            <span>{mode.emoji}</span>
            <span>{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
