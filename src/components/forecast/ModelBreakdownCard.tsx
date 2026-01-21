'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MODEL_INFO, MODEL_COLORS, type ModelName, type ForecastResponse } from '@/types/forecast';
import { formatSnow } from '@/lib/utils/format';

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
  const minSnow = Math.min(...snowValues);
  const maxSnow = Math.max(...snowValues);
  const spread = maxSnow - minSnow;

  // Determine confidence based on spread
  const confidence = spread < 2 ? 'HIGH' : spread < 5 ? 'MODERATE' : 'LOW';
  const confidenceColor = confidence === 'HIGH' ? 'text-green-500' : confidence === 'MODERATE' ? 'text-yellow-500' : 'text-red-500';

  return (
    <Card>
      <CardHeader className="pb-2 px-3 md:px-4">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Model Breakdown</span>
          <span className="text-xs text-muted-foreground">{timePeriod}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 md:px-4 space-y-3">
        {/* Summary */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
          <div>
            <div className="text-xs text-muted-foreground">Snow Range</div>
            <div className="font-semibold">{formatSnow(minSnow)} - {formatSnow(maxSnow)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Confidence</div>
            <div className={`font-semibold ${confidenceColor}`}>{confidence}</div>
          </div>
        </div>

        {/* Model List */}
        <div className="space-y-1.5">
          {modelTotals.map(({ key, name, color, snowTotal, isAI, resolution }) => (
            <div
              key={key}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm">{name}</span>
                  {isAI && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                      AI
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{resolution}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-semibold text-sm">{formatSnow(snowTotal)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          Models sorted by snow total • AI models use machine learning
        </div>
      </CardContent>
    </Card>
  );
}
