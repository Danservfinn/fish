import type { Feature, FeatureCollection, Point } from 'geojson';

export type PrecipitationType =
  | 'rain'
  | 'snow'
  | 'freezing_rain'
  | 'showers'
  | 'thunderstorm'
  | 'none';

export type PrecipitationModel = 'nbm' | 'ecmwf';

export interface PrecipitationCell {
  lat: number;
  lon: number;
  rate: number;           // mm/hr
  type: PrecipitationType;
  weatherCode: number;
  color: string;
  model: PrecipitationModel;
  nextHourForecast: number;
}

export interface PrecipitationProperties {
  rate: number;
  type: PrecipitationType;
  weatherCode: number;
  color: string;
  opacity: number;
  model: PrecipitationModel;
  nextHourForecast: number;
  movementAngle?: number;  // degrees
  movementSpeed?: number;  // km/h
}

export type PrecipitationFeature = Feature<Point, PrecipitationProperties>;
export type PrecipitationGeoJSON = FeatureCollection<Point, PrecipitationProperties>;

export interface GridConfig {
  resolution: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  points: Array<{ lat: number; lon: number }>;
}

export interface RadarLayerState {
  intensity: boolean;
  type: boolean;
  movement: boolean;
}

export interface RadarState {
  isVisible: boolean;
  opacity: number;
  layers: RadarLayerState;
  isPlaying: boolean;
  currentFrameIndex: number;
  lastUpdated: Date | null;
}

export interface AnimationFrame {
  timestamp: string;
  data: PrecipitationGeoJSON;
}

export interface OpenMeteoPrecipitationResponse {
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone?: string;
  current?: {
    time: string;
    precipitation?: number;
    rain?: number;
    snowfall?: number;
    weather_code?: number;
  };
  minutely_15?: {
    time: string[];
    precipitation?: number[];
    rain?: number[];
    snowfall?: number[];
  };
  hourly?: {
    time: string[];
    precipitation?: number[];
    weather_code?: number[];
  };
}

export interface CachedPrecipitationData {
  data: PrecipitationCell;
  timestamp: number;
  minutely15?: Array<{ time: string; rate: number }>;
}
