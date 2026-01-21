'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic import for MapContainer (MapLibre requires client-side only)
const MapContainer = dynamic(
  () => import('@/components/map/MapContainer'),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

// Dynamic import for ForecastPanel
const ForecastPanel = dynamic(
  () => import('@/components/forecast/ForecastPanel'),
  {
    ssr: false,
    loading: () => <PanelSkeleton />,
  }
);

function MapSkeleton() {
  return (
    <div className="absolute inset-0 bg-background">
      <Skeleton className="w-full h-full" />
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="w-full h-full p-4 space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  const selectedLocation = lat && lon
    ? { lat: parseFloat(lat), lon: parseFloat(lon) }
    : null;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Map takes full viewport */}
      <MapContainer
        selectedLocation={selectedLocation}
      />

      {/* Forecast panel - only shows when location selected */}
      {selectedLocation && (
        <ForecastPanel
          lat={selectedLocation.lat}
          lon={selectedLocation.lon}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
