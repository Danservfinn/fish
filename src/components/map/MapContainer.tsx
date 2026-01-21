'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin } from 'lucide-react';
import LocationSearch from './LocationSearch';

// CartoDB Dark Matter - free, no API key needed
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

interface MapContainerProps {
  selectedLocation: { lat: number; lon: number } | null;
}

export default function MapContainer({ selectedLocation }: MapContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial view - center of US or selected location
  const [viewState, setViewState] = useState({
    longitude: selectedLocation?.lon ?? -98.5795,
    latitude: selectedLocation?.lat ?? 39.8283,
    zoom: selectedLocation ? 8 : 4,
  });

  const handleMapClick = useCallback((event: { lngLat: { lng: number; lat: number } }) => {
    const { lng, lat } = event.lngLat;

    // Update URL with new coordinates
    const params = new URLSearchParams(searchParams.toString());
    params.set('lat', lat.toFixed(4));
    params.set('lon', lng.toFixed(4));

    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleLocationSelect = useCallback((lat: number, lon: number) => {
    // Update view to center on selected location
    setViewState(prev => ({
      ...prev,
      longitude: lon,
      latitude: lat,
      zoom: 8,
    }));

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('lat', lat.toFixed(4));
    params.set('lon', lon.toFixed(4));

    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return (
    <div className="absolute inset-0">
      {/* Search bar */}
      <div className="absolute top-4 left-4 right-4 md:right-auto md:w-80 z-10">
        <LocationSearch onLocationSelect={handleLocationSelect} />
      </div>

      {/* Map */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        cursor="crosshair"
      >
        <NavigationControl position="bottom-right" />
        <GeolocateControl
          position="bottom-right"
          trackUserLocation
          onGeolocate={(e) => {
            handleLocationSelect(e.coords.latitude, e.coords.longitude);
          }}
        />

        {/* Selected location marker */}
        {selectedLocation && (
          <Marker
            longitude={selectedLocation.lon}
            latitude={selectedLocation.lat}
            anchor="bottom"
          >
            <div className="animate-bounce">
              <MapPin className="w-8 h-8 text-primary fill-primary/20" />
            </div>
          </Marker>
        )}
      </Map>

      {/* Attribution */}
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground/60">
        © CartoDB © OpenStreetMap
      </div>
    </div>
  );
}
