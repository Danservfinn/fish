'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MODEL_INFO, MODEL_COLORS, type ModelName, type ForecastResponse } from '@/types/forecast';
import { formatSnow } from '@/lib/utils/format';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ModelBreakdownCardProps {
  data: ForecastResponse;
  timePeriod: string;
}

export default function ModelBreakdownCard({ data, timePeriod }: ModelBreakdownCardProps) {
  // Calculate totals per model
  const modelTotals = (Object.entries(data.models) as [ModelName, typeof data.models[keyof typeof data.models]][])
    .filter(([, model]) => model !== null)
    .map(([key, model]) => {
      const snowTotal = model!.daily.reduce((sum, d) => sum + (d.snowfallSum ?? 0), 0);
      const rainTotal = model!.daily.reduce((sum, d) => sum + (d.precipitationSum ?? 0), 0);
      return {
        key,
        name: MODEL_INFO[key].name,
        color: MODEL_COLORS[key],
        snowTotal,
        rainTotal,
        isAI: MODEL_INFO[key].organization.includes('AI'),
        resolution: MODEL_INFO[key].resolution,
      };
    })
    .sort((a, b) => b.snowTotal - a.snowTotal);

  const snowValues = modelTotals.map(m => m.snowTotal);
  const minSnow = snowValues.length > 0 ? Math.min(...snowValues) : 0;
  const maxSnow = snowValues.length > 0 ? Math.max(...snowValues) : 0;
  const avgSnow = snowValues.length > 0 ? snowValues.reduce((a, b) => a + b, 0) / snowValues.length : 0;
  const spread = maxSnow - minSnow;

  // Determine confidence based on spread
  const confidence = spread < 2 ? 'HIGH' : spread < 5 ? 'MODERATE' : 'LOW';
  const confidenceConfig = {
    HIGH: {
      textClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    },
    MODERATE: {
      textClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
    },
    LOW: {
      textClass: 'text-red-600 dark:text-red-400',
      bgClass: 'bg-red-500/10 dark:bg-red-500/15',
    },
  }[confidence];

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 px-4 md:px-5">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="font-semibold">Model Breakdown</span>
          <span className="text-xs text-muted-foreground font-normal">{timePeriod}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 md:px-5 space-y-4">
        {/* Summary Stats - Miller's Law: 3 key stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2.5 rounded-lg bg-muted/30">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
              Range
            </div>
            <div className="font-data text-sm font-semibold text-foreground">
              {formatSnow(minSnow)} – {formatSnow(maxSnow)}
            </div>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-muted/30">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
              Average
            </div>
            <div className="font-data text-sm font-semibold text-foreground">
              {formatSnow(avgSnow)}
            </div>
          </div>
          <div className={`text-center p-2.5 rounded-lg ${confidenceConfig.bgClass}`}>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
              Confidence
            </div>
            <div className={`font-data text-sm font-semibold ${confidenceConfig.textClass}`}>
              {confidence}
            </div>
          </div>
        </div>

        {/* Model List - Sorted by prediction */}
        <div className="space-y-1">
          {modelTotals.map(({ key, name, color, snowTotal, isAI, resolution }) => {
            const deviation = snowTotal - avgSnow;
            const isAbove = deviation > 0.5;
            const isBelow = deviation < -0.5;

            return (
              <div
                key={key}
                className="
                  flex items-center gap-3 p-2.5 rounded-lg
                  hover:bg-muted/30 transition-colors duration-150
                "
              >
                {/* Color indicator */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-background shadow-sm"
                  style={{ backgroundColor: color }}
                />

                {/* Model info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm text-foreground">{name}</span>
                    {isAI && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-medium">
                        AI
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{resolution}</div>
                </div>

                {/* Trend indicator */}
                <div className="flex items-center gap-1">
                  {isAbove && <TrendingUp className="w-3.5 h-3.5 text-blue-500" />}
                  {isBelow && <TrendingDown className="w-3.5 h-3.5 text-amber-500" />}
                  {!isAbove && !isBelow && <Minus className="w-3.5 h-3.5 text-muted-foreground/50" />}
                </div>

                {/* Snow total */}
                <div className="text-right min-w-[50px]">
                  <div className="font-data font-semibold text-sm text-foreground">
                    {formatSnow(snowTotal)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground text-center">
            Sorted by predicted snowfall • AI models use machine learning
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
