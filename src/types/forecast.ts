export type ModelName = 'ecmwf' | 'gfs' | 'graphcast' | 'nbm' | 'hrrr' | 'icon' | 'ecmwf_aifs';

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
    graphcast: ModelForecast | null;
    nbm: ModelForecast | null;
    hrrr: ModelForecast | null;
    icon: ModelForecast | null;
    ecmwf_aifs: ModelForecast | null;
  };
  summary: ForecastSummary;
}

// Precipitation color scales
export const RAIN_COLORS = [
  { min: 0, max: 0.01, color: 'transparent', label: 'None' },
  { min: 0.01, max: 0.25, color: '#E0FFE0', label: 'Trace' },
  { min: 0.25, max: 0.5, color: '#98FB98', label: 'Light' },
  { min: 0.5, max: 1, color: '#32CD32', label: 'Moderate' },
  { min: 1, max: 2, color: '#228B22', label: 'Heavy' },
  { min: 2, max: 4, color: '#006400', label: 'Very Heavy' },
  { min: 4, max: Infinity, color: '#004D00', label: 'Extreme' },
] as const;

export const SNOW_COLORS = [
  { min: 0, max: 0.1, color: 'transparent', label: 'None' },
  { min: 0.1, max: 1, color: '#F0F8FF', label: 'Dusting' },
  { min: 1, max: 3, color: '#ADD8E6', label: 'Light' },
  { min: 3, max: 6, color: '#87CEEB', label: 'Moderate' },
  { min: 6, max: 12, color: '#4169E1', label: 'Heavy' },
  { min: 12, max: 18, color: '#0000CD', label: 'Very Heavy' },
  { min: 18, max: Infinity, color: '#00008B', label: 'Extreme' },
] as const;

export type TimePeriod = '24h' | '48h' | '7d' | 'custom';
export type PrecipMode = 'rain' | 'snow' | 'total';
export type ViewMode = 'single' | 'comparison' | 'spread';

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
  graphcast: 'hsl(330 85% 55%)',
  nbm: 'hsl(45 100% 50%)',
  hrrr: 'hsl(38 92% 50%)',
  icon: 'hsl(280 65% 60%)',
  ecmwf_aifs: 'hsl(190 85% 50%)',
};

export interface ModelInfoType {
  name: string;
  fullName: string;
  resolution: string;
  range: string;
  description: string;
  sourceUrl: string;
  organization: string;
}

export const MODEL_INFO: Record<ModelName, ModelInfoType> = {
  ecmwf: {
    name: 'ECMWF',
    fullName: 'European Centre for Medium-Range Weather Forecasts',
    resolution: '9km',
    range: '15 days',
    description: 'The gold standard in weather prediction. Consistently ranked #1 for accuracy worldwide.',
    sourceUrl: 'https://www.ecmwf.int/',
    organization: 'European Union',
  },
  gfs: {
    name: 'GFS',
    fullName: 'Global Forecast System',
    resolution: '25km',
    range: '16 days',
    description: 'The primary American weather model run by NOAA. Good for broad trends and long-range forecasts.',
    sourceUrl: 'https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast',
    organization: 'NOAA (USA)',
  },
  graphcast: {
    name: 'GraphCast',
    fullName: 'Google DeepMind GraphCast',
    resolution: '25km',
    range: '10 days',
    description: 'Google DeepMind\'s AI weather model using graph neural networks. Made headlines for outperforming traditional models.',
    sourceUrl: 'https://deepmind.google/discover/blog/graphcast-ai-model-for-faster-and-more-accurate-global-weather-forecasting/',
    organization: 'Google DeepMind (AI)',
  },
  nbm: {
    name: 'NBM',
    fullName: 'National Blend of Models',
    resolution: '~3km',
    range: '10 days',
    description: 'NOAA\'s statistical blend of multiple US models. Best consensus forecast for US locations.',
    sourceUrl: 'https://vlab.noaa.gov/web/mdl/nbm',
    organization: 'NOAA (USA)',
  },
  hrrr: {
    name: 'HRRR',
    fullName: 'High-Resolution Rapid Refresh',
    resolution: '3km',
    range: '48 hours',
    description: 'Ultra-high resolution US model updated hourly. Best for precise timing and local storm details.',
    sourceUrl: 'https://rapidrefresh.noaa.gov/hrrr/',
    organization: 'NOAA (USA)',
  },
  icon: {
    name: 'ICON',
    fullName: 'Icosahedral Nonhydrostatic Model',
    resolution: '13km',
    range: '7 days',
    description: 'German weather model known for rapid updates and strong European accuracy.',
    sourceUrl: 'https://www.dwd.de/EN/research/weatherforecasting/num_modelling/01_num_weather_prediction_modells/icon_description.html',
    organization: 'DWD (Germany)',
  },
  ecmwf_aifs: {
    name: 'ECMWF AIFS',
    fullName: 'ECMWF Artificial Intelligence Forecast System',
    resolution: '25km',
    range: '10 days',
    description: 'ECMWF\'s ML-based weather model using deep learning trained on 40+ years of ERA5 reanalysis data.',
    sourceUrl: 'https://www.ecmwf.int/en/forecasts/documentation-and-support/aifs',
    organization: 'ECMWF (AI)',
  },
};
