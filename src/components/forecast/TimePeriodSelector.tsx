'use client';

import type { TimePeriod } from '@/types/forecast';
import { Clock } from 'lucide-react';

interface TimePeriodSelectorProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
}

const periods: { value: TimePeriod; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '48h', label: '48h' },
  { value: '7d', label: '7 Days' },
  { value: 'custom', label: 'Custom' },
];

export default function TimePeriodSelector({ value, onChange }: TimePeriodSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-wider font-medium">Period</span>
      </div>
      <div
        className="
          flex-1 flex gap-1 p-1
          rounded-lg
          bg-muted/40
          border border-border/30
        "
      >
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onChange(period.value)}
            className={`
              flex-1 px-3 py-2 rounded-md
              text-xs font-medium
              transition-all duration-200
              ${value === period.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }
            `}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}
