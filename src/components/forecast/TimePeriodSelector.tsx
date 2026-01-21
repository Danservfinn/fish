'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TimePeriod } from '@/types/forecast';

interface TimePeriodSelectorProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
}

export default function TimePeriodSelector({ value, onChange }: TimePeriodSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TimePeriod)} className="w-full">
      <TabsList className="grid w-full grid-cols-4 h-9">
        <TabsTrigger value="24h" className="text-xs px-2">24h</TabsTrigger>
        <TabsTrigger value="48h" className="text-xs px-2">48h</TabsTrigger>
        <TabsTrigger value="7d" className="text-xs px-2">7 Days</TabsTrigger>
        <TabsTrigger value="custom" className="text-xs px-2">Custom</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
