'use client';

import { useState } from 'react';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeatherModels } from '@/lib/hooks/useWeatherModels';
import { ThemeToggle } from '@/components/theme';
import ModelAgreementMeter from './ModelAgreementMeter';
import DailyComparisonChart from './DailyComparisonChart';
import ModelTooltip from './ModelTooltip';
import TimePeriodSelector from './TimePeriodSelector';
import PrecipModeSelector from './PrecipModeSelector';
import ModelBreakdownCard from './ModelBreakdownCard';
import { MODEL_INFO, MODEL_COLORS, type ModelName, type TimePeriod, type PrecipMode } from '@/types/forecast';
import { formatSnow } from '@/lib/utils/format';
import { MapPin } from 'lucide-react';

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
    <div className="space-y-5 p-4 md:p-5">
      {/* ═══════════════════════════════════════════════
          CHUNK 1: Location Header (Primary Context)
          Miller's Law: First chunk establishes context
          ═══════════════════════════════════════════════ */}
      <header className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-tight truncate">
                {data?.location?.name || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {data?.location?.admin1 && `${data.location.admin1}, `}
                {data?.location?.country || 'Loading...'}
              </p>
            </div>
          </div>
          {/* Theme Toggle - Desktop only in header */}
          <div className="hidden md:block flex-shrink-0">
            <ThemeToggle variant="icon" />
          </div>
        </div>
        <div className="topo-line mt-3" />
      </header>

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="text-destructive p-6 text-center rounded-xl bg-destructive/5 border border-destructive/20">
          <p className="font-medium">Unable to load forecast</p>
          <p className="text-sm mt-1 text-destructive/70">Please try a different location</p>
        </div>
      ) : data ? (
        <>
          {/* ═══════════════════════════════════════════════
              CHUNK 2: Controls (Time + Type Selection)
              Miller's Law: Group related controls together
              ═══════════════════════════════════════════════ */}
          <section className="space-y-3" aria-label="Forecast controls">
            <TimePeriodSelector value={timePeriod} onChange={setTimePeriod} />
            <PrecipModeSelector value={precipMode} onChange={setPrecipMode} />
          </section>

          {/* ═══════════════════════════════════════════════
              CHUNK 3: Confidence Summary (Key Insight)
              Miller's Law: Single most important takeaway
              ═══════════════════════════════════════════════ */}
          <section aria-label="Model agreement">
            <ModelAgreementMeter agreement={data.summary.agreement} />
          </section>

          {/* ═══════════════════════════════════════════════
              CHUNK 4: Visual Forecast Chart
              Miller's Law: Primary data visualization
              ═══════════════════════════════════════════════ */}
          <section aria-label="Forecast chart">
            <Card className="overflow-hidden border-border/50 shadow-sm">
              <CardHeader className="pb-2 px-4 md:px-5 bg-muted/30">
                <CardTitle className="text-base flex items-center gap-2.5">
                  <span className="text-lg">
                    {precipMode === 'snow' && '❄️'}
                    {precipMode === 'rain' && '💧'}
                    {precipMode === 'total' && '🌧️'}
                  </span>
                  <span>
                    {precipMode === 'snow' ? 'Snowfall' : precipMode === 'rain' ? 'Rainfall' : 'Total Precipitation'}
                  </span>
                  <span className="text-xs text-muted-foreground font-normal ml-auto">
                    {timePeriodLabel}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 md:px-4 pt-2 pb-4">
                <DailyComparisonChart
                  models={data.models}
                  metric={precipMode === 'rain' ? 'precip' : 'snow'}
                />
              </CardContent>
            </Card>
          </section>

          {/* ═══════════════════════════════════════════════
              CHUNK 5: Detailed Model Breakdown
              Miller's Law: Expandable detailed information
              ═══════════════════════════════════════════════ */}
          <section aria-label="Model breakdown">
            <ModelBreakdownCard data={data} timePeriod={timePeriodLabel} />
          </section>

          {/* ═══════════════════════════════════════════════
              CHUNK 6: Model Legend (Reference)
              Miller's Law: Reference/legend grouped at bottom
              Shows max 7 models (within 7±2 rule)
              ═══════════════════════════════════════════════ */}
          <section aria-label="Weather models" className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
              Active Models
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(data.models) as ModelName[]).map((key) => {
                const model = data.models[key];
                if (!model) return null;
                const info = MODEL_INFO[key];
                const totalSnow = model.daily.reduce((sum, d) => sum + (d.snowfallSum || 0), 0);
                const isAI = info.organization.includes('AI');
                return (
                  <ModelTooltip key={key} model={key}>
                    <div
                      className="
                        flex items-center gap-2 p-2.5 rounded-lg
                        bg-card border border-border/50
                        hover:border-border hover:shadow-sm
                        transition-all duration-200 cursor-help
                        min-h-[52px] md:min-h-0
                      "
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-background"
                        style={{ backgroundColor: MODEL_COLORS[key] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-xs text-foreground truncate">
                            {info.name}
                          </span>
                          {isAI && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 font-medium">
                              AI
                            </span>
                          )}
                        </div>
                        <div className="font-data text-xs text-muted-foreground">
                          {formatSnow(totalSnow)}
                        </div>
                      </div>
                    </div>
                  </ModelTooltip>
                );
              })}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════
              CHUNK 7: Footer Info (Minimal)
              Miller's Law: Minimal footer, keep cognitive load low
              ═══════════════════════════════════════════════ */}
          <footer className="pt-2">
            <div className="topo-line mb-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tap model for details</span>
              {/* Theme Toggle - Mobile only in footer */}
              <div className="md:hidden">
                <ThemeToggle variant="icon" className="w-8 h-8" />
              </div>
              <span className="hidden md:block">AI models use machine learning</span>
            </div>
          </footer>
        </>
      ) : null}
    </div>
  );

  if (isDesktop) {
    return (
      <Sheet open={true} modal={false}>
        <SheetContent
          side="right"
          className="
            w-[440px] p-0 overflow-y-auto
            border-l border-border/50
            bg-background/98 backdrop-blur-xl
            shadow-2xl shadow-black/5 dark:shadow-black/20
          "
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <SheetHeader className="
            p-4 pb-3
            border-b border-border/50
            sticky top-0 z-10
            bg-background/95 backdrop-blur-sm
          ">
            <SheetTitle className="text-lg">Weather Comparison</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={true} modal={false}>
      <DrawerContent className="max-h-[85vh] bg-background">
        <DrawerHeader className="border-b border-border/50 pb-3">
          <DrawerTitle className="text-lg">Weather Comparison</DrawerTitle>
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
    <div className="space-y-5">
      {/* Controls skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      {/* Agreement meter skeleton */}
      <Skeleton className="h-24 w-full rounded-xl" />
      {/* Chart skeleton */}
      <Skeleton className="h-56 w-full rounded-xl" />
      {/* Breakdown skeleton */}
      <Skeleton className="h-48 w-full rounded-xl" />
      {/* Models grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
