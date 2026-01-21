'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PrecipMode } from '@/types/forecast';

interface PrecipModeSelectorProps {
  value: PrecipMode;
  onChange: (value: PrecipMode) => void;
}

export default function PrecipModeSelector({ value, onChange }: PrecipModeSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as PrecipMode)} className="w-full">
      <TabsList className="grid w-full grid-cols-3 h-9">
        <TabsTrigger value="snow" className="text-xs px-2 gap-1">
          <span>❄️</span> Snow
        </TabsTrigger>
        <TabsTrigger value="rain" className="text-xs px-2 gap-1">
          <span>💧</span> Rain
        </TabsTrigger>
        <TabsTrigger value="total" className="text-xs px-2 gap-1">
          <span>🌧️</span> Total
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
