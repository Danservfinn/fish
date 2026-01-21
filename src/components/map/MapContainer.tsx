'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent, ViewStateChangeEvent, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin } from 'lucide-react';
import LocationSearch from './LocationSearch';
import PrecipitationLayer from './PrecipitationLayer';
import MapLegend from './MapLegend';
import MapControls, { type MapMode } from './MapControls';
import RadarOverlay from './RadarOverlay';
import RadarControls from './RadarControls';
import RadarLegend from './RadarLegend';
import RadarPopup from './RadarPopup';
import { useViewportGrid } from '@/lib/hooks/useViewportGrid';
import { usePrecipitationData } from '@/lib/hooks/usePrecipitationData';
import { useRadarAnimation } from '@/lib/hooks/useRadarAnimation';
import type { PrecipMode } from '@/types/forecast';
import type { RadarLayerState, PrecipitationProperties } from '@/types/precipitation';
import { DEFAULT_RADAR_STATE } from '@/constants/precipitation';

// Map styles for light and dark themes
const MAP_STYLES = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};

interface MapContainerProps {
  selectedLocation: { lat: number; lon: number } | null;
}

export default function MapContainer({ selectedLocation }: MapContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapRef = useRef<MapRef>(null);

  // Detect theme from DOM
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    setIsDark(document.documentElement.classList.contains('dark'));

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Map state
  const [viewState, setViewState] = useState({
    longitude: selectedLocation?.lon ?? -98.5795,
    latitude: selectedLocation?.lat ?? 39.8283,
    zoom: selectedLocation ? 8 : 4,
  });

  // Layer state
  const [mapMode, setMapMode] = useState<MapMode>('accumulation');
  const [precipMode, setPrecipMode] = useState<PrecipMode>('snow');
  // Default layer OFF to avoid rate limiting Open-Meteo API
  const [layerVisible, setLayerVisible] = useState(false);

  // Radar state
  const [radarVisible, setRadarVisible] = useState<boolean>(DEFAULT_RADAR_STATE.isVisible);
  const [radarOpacity, setRadarOpacity] = useState<number>(DEFAULT_RADAR_STATE.opacity);
  const [radarLayers, setRadarLayers] = useState<RadarLayerState>(DEFAULT_RADAR_STATE.layers);
  const [radarPopup, setRadarPopup] = useState<{
    longitude: number;
    latitude: number;
    properties: PrecipitationProperties;
  } | null>(null);

  // Radar data hooks
  const { grid, updateGrid } = useViewportGrid();
  const { data: precipitationData, geoJSON, isLoading, lastUpdated, refresh } = usePrecipitationData(grid);
  const {
    currentFrame,
    currentFrameIndex,
    frameCount,
    isPlaying,
    toggle: togglePlay,
    setFrame,
  } = useRadarAnimation(precipitationData, grid?.resolution ?? 1);

  // Trigger initial grid update when switching to Live mode
  useEffect(() => {
    if (mapMode !== 'live') return;

    const map = mapRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    if (bounds) {
      updateGrid(
        {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
        viewState.zoom
      );
    }
  }, [mapMode, updateGrid, viewState.zoom]);

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

  // Handle map move end for radar grid update
  const handleMoveEnd = useCallback((evt: ViewStateChangeEvent) => {
    if (mapMode !== 'live') return;

    const bounds = evt.target.getBounds();
    if (bounds) {
      updateGrid(
        {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
        evt.viewState.zoom
      );
    }
  }, [mapMode, updateGrid]);

  // Handle radar layer click
  const handleRadarClick = useCallback((event: MapLayerMouseEvent) => {
    if (mapMode !== 'live' || !event.features?.length) return;

    const feature = event.features[0];
    if (feature.layer?.id === 'precipitation-fill' && feature.geometry.type === 'Point') {
      const [lon, lat] = feature.geometry.coordinates;
      setRadarPopup({
        longitude: lon,
        latitude: lat,
        properties: feature.properties as PrecipitationProperties,
      });
    }
  }, [mapMode]);

  // Toggle radar layer
  const handleToggleRadarLayer = useCallback((layer: keyof RadarLayerState) => {
    setRadarLayers(prev => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  }, []);

  // Theme-aware marker colors
  const markerColor = isDark ? '#38bdf8' : '#0284c7'; // sky-400 vs sky-600

  return (
    <div className="absolute inset-0 no-transition">
      {/* Search bar */}
      <div className="absolute top-4 left-4 right-4 md:right-auto md:w-80 z-10">
        <LocationSearch onLocationSelect={handleLocationSelect} />
      </div>

      {/* Map Controls */}
      <MapControls
        mapMode={mapMode}
        onMapModeChange={setMapMode}
        precipMode={precipMode}
        onPrecipModeChange={setPrecipMode}
        layerVisible={layerVisible}
        onLayerVisibleChange={setLayerVisible}
      />

      {/* Radar Controls (for live mode) */}
      {mapMode === 'live' && (
        <div className="absolute top-52 left-4 z-10">
          <RadarControls
            isVisible={radarVisible}
            opacity={radarOpacity}
            layers={radarLayers}
            isPlaying={isPlaying}
            isLoading={isLoading}
            lastUpdated={lastUpdated}
            frameCount={frameCount}
            currentFrameIndex={currentFrameIndex}
            onToggleVisibility={() => setRadarVisible(!radarVisible)}
            onOpacityChange={setRadarOpacity}
            onToggleLayer={handleToggleRadarLayer}
            onTogglePlay={togglePlay}
            onRefresh={refresh}
            onFrameChange={setFrame}
          />
        </div>
      )}

      {/* Map */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        onClick={mapMode === 'live' ? handleRadarClick : handleMapClick}
        mapStyle={isDark ? MAP_STYLES.dark : MAP_STYLES.light}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        cursor="crosshair"
        interactiveLayerIds={mapMode === 'live' ? ['precipitation-fill'] : undefined}
      >
        <NavigationControl position="bottom-right" />
        <GeolocateControl
          position="bottom-right"
          trackUserLocation
          onGeolocate={(e) => {
            handleLocationSelect(e.coords.latitude, e.coords.longitude);
          }}
        />

        {/* Precipitation Layer (Accumulation Mode) */}
        {mapMode === 'accumulation' && (
          <PrecipitationLayer
            mode={precipMode}
            days={7}
            visible={layerVisible}
          />
        )}

        {/* Radar Overlay (Live Mode) */}
        {mapMode === 'live' && (
          <RadarOverlay
            data={currentFrame ?? geoJSON}
            opacity={radarOpacity}
            layers={radarLayers}
            isVisible={radarVisible}
          />
        )}

        {/* Radar Popup */}
        {radarPopup && (
          <RadarPopup
            longitude={radarPopup.longitude}
            latitude={radarPopup.latitude}
            properties={radarPopup.properties}
            onClose={() => setRadarPopup(null)}
          />
        )}

        {/* Selected location marker */}
        {selectedLocation && (
          <Marker
            longitude={selectedLocation.lon}
            latitude={selectedLocation.lat}
            anchor="bottom"
          >
            <div className="relative">
              {/* Glow effect */}
              <div
                className="absolute inset-0 -m-2 rounded-full animate-ping"
                style={{
                  background: `radial-gradient(circle, ${markerColor}40 0%, transparent 70%)`,
                  animationDuration: '2s',
                }}
              />
              {/* Pin */}
              <MapPin
                className="w-8 h-8"
                style={{
                  color: markerColor,
                  filter: `drop-shadow(0 2px 4px ${markerColor}50)`,
                }}
                fill={`${markerColor}20`}
              />
            </div>
          </Marker>
        )}
      </Map>

      {/* Legend */}
      {mapMode === 'accumulation' && (
        <MapLegend mode={precipMode} visible={layerVisible} />
      )}

      {/* Radar Legend (Live Mode) */}
      {mapMode === 'live' && (
        <div className="absolute bottom-20 left-4 z-10">
          <RadarLegend isVisible={radarVisible} />
        </div>
      )}

      {/* Attribution */}
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground/50">
        © CartoDB © OpenStreetMap • Weather data: Open-Meteo
      </div>

      {/* Clear conditions indicator (Live Mode) */}
      {mapMode === 'live' && radarVisible && !isLoading && precipitationData.length > 0 &&
        precipitationData.every(cell => cell.rate < 0.1) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="
              px-6 py-4 rounded-2xl text-center
              bg-card/95 dark:bg-card/90
              backdrop-blur-xl
              border border-border/50
              shadow-xl shadow-black/5 dark:shadow-black/20
            "
          >
            <div className="text-2xl mb-2">☀️</div>
            <div className="text-sm font-semibold text-foreground">Clear Conditions</div>
            <div className="text-xs text-muted-foreground mt-1">No precipitation detected</div>
          </div>
        </div>
      )}
    </div>
  );
}
