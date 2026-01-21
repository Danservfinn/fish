'use client';

import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeatherModels } from '@/lib/hooks/useWeatherModels';
import ModelAgreementMeter from './ModelAgreementMeter';
import DailyComparisonChart from './DailyComparisonChart';
import { MODEL_INFO, type ModelName } from '@/types/forecast';
import { formatSnow } from '@/lib/utils/format';

interface ForecastPanelProps {
  lat: number;
  lon: number;
}

export default function ForecastPanel({ lat, lon }: ForecastPanelProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { data, isLoading, error } = useWeatherModels(lat, lon);

  const content = (
    <div className="space-y-4 p-4">
      {/* Location Header */}
      <div>
        <h2 className="text-lg font-semibold">
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
          {/* Agreement Meter */}
          <ModelAgreementMeter agreement={data.summary.agreement} />

          {/* Model Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Snow Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <DailyComparisonChart models={data.models} metric="snow" />
            </CardContent>
          </Card>

          {/* Model Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(Object.keys(data.models) as ModelName[]).map((key) => {
              const model = data.models[key];
              if (!model) return null;
              const info = MODEL_INFO[key];
              const totalSnow = model.daily.reduce((sum, d) => sum + (d.snowfallSum || 0), 0);
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 p-2 rounded bg-secondary/50"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(var(--chart-${key === 'ecmwf' ? '1' : key === 'gfs' ? '2' : key === 'hrrr' ? '3' : '4'}))` }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{info.name}</div>
                    <div className="text-muted-foreground">{formatSnow(totalSnow)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );

  if (isDesktop) {
    return (
      <Sheet open={true} modal={false}>
        <SheetContent
          side="right"
          className="w-[400px] p-0 border-l border-border bg-background/95 backdrop-blur-sm"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle>Weather Forecast</SheetTitle>
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
          <DrawerTitle>Weather Forecast</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-auto">
          {content}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-40 w-full" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
