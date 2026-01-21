'use client';

import { useState } from 'react';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeatherModels } from '@/lib/hooks/useWeatherModels';
import ModelAgreementMeter from './ModelAgreementMeter';
import DailyComparisonChart from './DailyComparisonChart';
import ModelTooltip from './ModelTooltip';
import TimePeriodSelector from './TimePeriodSelector';
import PrecipModeSelector from './PrecipModeSelector';
import ModelBreakdownCard from './ModelBreakdownCard';
import { MODEL_INFO, MODEL_COLORS, type ModelName, type TimePeriod, type PrecipMode } from '@/types/forecast';
import { formatSnow } from '@/lib/utils/format';

interface ForecastPanelProps {
  lat: number;
  lon: number;
}

export default function ForecastPanel({ lat, lon }: ForecastPanelProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { data, isLoading, error } = useWeatherModels(lat, lon);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7d');
  const [precipMode, setPrecipMode] = useState<PrecipMode>('snow');

  // Get time period label
  const timePeriodLabel = {
    '24h': 'Next 24 Hours',
    '48h': 'Next 48 Hours',
    '7d': 'Next 7 Days',
    'custom': 'Custom Range',
  }[timePeriod];

  const content = (
    <div className="space-y-4 p-4 md:p-4">
      {/* Location Header */}
      <div>
        <h2 className="text-lg md:text-xl font-semibold">
          {data?.location?.name || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`}
        </h2>
        <p className="text-sm text-muted-foreground">
          {data?.location?.admin1 && `${data.location.admin1}, `}
          {data?.location?.country || 'Loading...'}
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="text-destructive p-4 text-center">
          Failed to load forecast data
        </div>
      ) : data ? (
        <>
          {/* Time Period Selector */}
          <TimePeriodSelector value={timePeriod} onChange={setTimePeriod} />

          {/* Precipitation Mode Selector */}
          <PrecipModeSelector value={precipMode} onChange={setPrecipMode} />

          {/* Agreement Meter */}
          <ModelAgreementMeter agreement={data.summary.agreement} />

          {/* Model Comparison Chart */}
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6">
              <CardTitle className="text-base flex items-center gap-2">
                {precipMode === 'snow' && '❄️'}
                {precipMode === 'rain' && '💧'}
                {precipMode === 'total' && '🌧️'}
                {precipMode === 'snow' ? 'Snow' : precipMode === 'rain' ? 'Rain' : 'Precipitation'} Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 md:px-6">
              <DailyComparisonChart
                models={data.models}
                metric={precipMode === 'rain' ? 'precip' : 'snow'}
              />
            </CardContent>
          </Card>

          {/* Model Breakdown Card */}
          <ModelBreakdownCard data={data} timePeriod={timePeriodLabel} />

          {/* Model Legend with Tooltips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-2">
            {(Object.keys(data.models) as ModelName[]).map((key) => {
              const model = data.models[key];
              if (!model) return null;
              const info = MODEL_INFO[key];
              const totalSnow = model.daily.reduce((sum, d) => sum + (d.snowfallSum || 0), 0);
              const isAI = info.organization.includes('AI');
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 p-3 md:p-2 rounded-lg bg-secondary/50 min-h-[56px] md:min-h-0 touch-manipulation"
                >
                  <div
                    className="w-4 h-4 md:w-3 md:h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: MODEL_COLORS[key] }}
                  />
                  <div className="flex-1 min-w-0">
                    <ModelTooltip model={key}>
                      <span className="font-medium text-sm md:text-xs flex items-center gap-1">
                        {info.name}
                        {isAI && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400">
                            AI
                          </span>
                        )}
                      </span>
                    </ModelTooltip>
                    <div className="text-muted-foreground text-sm md:text-xs">{formatSnow(totalSnow)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Model Info Note */}
          <p className="text-xs text-muted-foreground text-center px-2">
            Tap model names for details • AI models use machine learning
          </p>
        </>
      ) : null}
    </div>
  );

  if (isDesktop) {
    return (
      <Sheet open={true} modal={false}>
        <SheetContent
          side="right"
          className="w-[420px] p-0 border-l border-border bg-background/95 backdrop-blur-sm overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <SheetHeader className="p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <SheetTitle>Weather Model Comparison</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={true} modal={false}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border">
          <DrawerTitle>Weather Model Comparison</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-auto pb-safe">
          {content}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-40 md:h-48 w-full" />
      <Skeleton className="h-48 w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Skeleton className="h-14 md:h-12 w-full" />
        <Skeleton className="h-14 md:h-12 w-full" />
        <Skeleton className="h-14 md:h-12 w-full" />
        <Skeleton className="h-14 md:h-12 w-full" />
        <Skeleton className="h-14 md:h-12 w-full" />
        <Skeleton className="h-14 md:h-12 w-full" />
        <Skeleton className="h-14 md:h-12 w-full" />
      </div>
    </div>
  );
}
