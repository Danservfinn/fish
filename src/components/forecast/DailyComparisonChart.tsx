'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ModelForecast, ModelName } from '@/types/forecast';
import { MODEL_COLORS, MODEL_INFO } from '@/types/forecast';
import { formatDate, cmToInches } from '@/lib/utils/format';

interface DailyComparisonChartProps {
  models: {
    ecmwf: ModelForecast | null;
    gfs: ModelForecast | null;
    hrrr: ModelForecast | null;
    icon: ModelForecast | null;
  };
  metric: 'snow' | 'precip';
}

export default function DailyComparisonChart({ models, metric }: DailyComparisonChartProps) {
  // Get all unique dates across models
  const allDates = new Set<string>();
  Object.values(models).forEach(model => {
    if (model) {
      model.daily.forEach(d => allDates.add(d.date));
    }
  });

  // Sort dates and take first 7
  const dates = Array.from(allDates).sort().slice(0, 7);

  // Build chart data
  const chartData = dates.map(date => {
    const dataPoint: Record<string, string | number | null> = {
      date: formatDate(date),
      fullDate: date,
    };

    (Object.entries(models) as [ModelName, ModelForecast | null][]).forEach(([key, model]) => {
      if (model) {
        const dayData = model.daily.find(d => d.date === date);
        const value = metric === 'snow'
          ? dayData?.snowfallSum ?? null
          : dayData?.precipitationSum ?? null;

        // Convert cm to inches for display
        dataPoint[key] = value !== null ? cmToInches(value) : null;
      }
    });

    return dataPoint;
  });

  const activeModels = (Object.keys(models) as ModelName[]).filter(
    key => models[key] !== null
  );

  return (
    <div className="w-full h-48 md:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
        >
          <XAxis
            dataKey="date"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            interval={0}
          />
          <YAxis
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(value) => `${value}"`}
            width={35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value, name) => {
              const displayName = MODEL_INFO[name as ModelName]?.name || String(name);
              if (value === null || value === undefined) return ['--', displayName];
              return [`${value}"`, displayName];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: '8px' }}
            formatter={(value: string) => MODEL_INFO[value as ModelName]?.name || value}
          />

          {activeModels.map((modelKey) => (
            <Bar
              key={modelKey}
              dataKey={modelKey}
              fill={MODEL_COLORS[modelKey]}
              radius={[2, 2, 0, 0]}
              maxBarSize={18}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
