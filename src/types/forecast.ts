export type ModelName = 'ecmwf' | 'gfs' | 'hrrr' | 'icon';

export interface HourlyData {
  time: string;
  snowfall: number | null;
  precipitation: number | null;
  temperature: number | null;
}

export interface DailyData {
  date: string;
  snowfallSum: number | null;
  precipitationSum: number | null;
  tempMax: number | null;
  tempMin: number | null;
}

export interface ModelForecast {
  model: ModelName;
  daily: DailyData[];
  hourly?: HourlyData[];
  lastUpdated: string;
  forecastHorizon: number;
}

export interface Location {
  name: string;
  lat: number;
  lon: number;
  elevation?: number;
  timezone?: string;
  country?: string;
  admin1?: string;
}

export interface AgreementResult {
  level: 'high' | 'moderate' | 'low';
  percentage: number;
  range: [number, number];
  bestEstimate: number;
}

export interface ForecastSummary {
  agreement: AgreementResult;
  snowStart: string | null;
  snowPeak: string | null;
  snowEnd: string | null;
  totalSnowRange: [number, number];
  totalPrecipRange: [number, number];
}

export interface ForecastResponse {
  location: Location;
  generated: string;
  models: {
    ecmwf: ModelForecast | null;
    gfs: ModelForecast | null;
    hrrr: ModelForecast | null;
    icon: ModelForecast | null;
  };
  summary: ForecastSummary;
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  country: string;
  admin1?: string;
  timezone: string;
}

export const MODEL_COLORS: Record<ModelName, string> = {
  ecmwf: 'hsl(210 100% 52%)',
  gfs: 'hsl(142 71% 45%)',
  hrrr: 'hsl(38 92% 50%)',
  icon: 'hsl(280 65% 60%)',
};

export const MODEL_INFO: Record<ModelName, { name: string; fullName: string; resolution: string; range: string }> = {
  ecmwf: { name: 'ECMWF', fullName: 'European Centre', resolution: '9km', range: '15 days' },
  gfs: { name: 'GFS', fullName: 'Global Forecast System', resolution: '25km', range: '16 days' },
  hrrr: { name: 'HRRR', fullName: 'High-Resolution Rapid Refresh', resolution: '3km', range: '48 hours' },
  icon: { name: 'ICON', fullName: 'Icosahedral Model', resolution: '13km', range: '7 days' },
};
