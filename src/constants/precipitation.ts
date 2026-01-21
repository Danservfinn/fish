import type { PrecipitationType } from '@/types/precipitation';

// Precipitation intensity color scale (mm/hr -> hex color)
export const PRECIPITATION_COLORS = {
  none: 'transparent',
  light: '#A6F28F',      // 0.1-2.5 mm/hr
  moderate: '#32CD32',   // 2.5-7.5 mm/hr
  heavy: '#FFD700',      // 7.5-15 mm/hr
  veryHeavy: '#FFA500',  // 15-30 mm/hr
  extreme: '#FF0000',    // 30+ mm/hr
} as const;

// Thresholds for color mapping (mm/hr)
export const PRECIPITATION_THRESHOLDS = {
  light: 0.1,
  moderate: 2.5,
  heavy: 7.5,
  veryHeavy: 15,
  extreme: 30,
} as const;

// Labels for the legend
export const PRECIPITATION_LABELS: Record<string, string> = {
  none: 'None',
  light: 'Light (0.1-2.5)',
  moderate: 'Moderate (2.5-7.5)',
  heavy: 'Heavy (7.5-15)',
  veryHeavy: 'Very Heavy (15-30)',
  extreme: 'Extreme (30+)',
};

// Grid resolution based on zoom level (degrees)
export const GRID_RESOLUTIONS: Record<string, number> = {
  low: 1.0,     // zoom 1-6
  medium: 0.25, // zoom 7-10
  high: 0.1,    // zoom 11+
};

export const ZOOM_THRESHOLDS = {
  lowToMedium: 6,
  mediumToHigh: 10,
} as const;

// Weather code to precipitation type mapping
// Based on WMO Weather interpretation codes
export const WEATHER_CODE_TO_TYPE: Record<number, PrecipitationType> = {
  // Clear
  0: 'none',
  1: 'none',
  2: 'none',
  3: 'none',

  // Fog
  45: 'none',
  48: 'none',

  // Drizzle
  51: 'rain',
  53: 'rain',
  55: 'rain',
  56: 'freezing_rain',
  57: 'freezing_rain',

  // Rain
  61: 'rain',
  63: 'rain',
  65: 'rain',
  66: 'freezing_rain',
  67: 'freezing_rain',

  // Snow
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snow',

  // Showers
  80: 'showers',
  81: 'showers',
  82: 'showers',
  85: 'snow',
  86: 'snow',

  // Thunderstorm
  95: 'thunderstorm',
  96: 'thunderstorm',
  99: 'thunderstorm',
};

// Precipitation type display info
export const PRECIPITATION_TYPE_INFO: Record<PrecipitationType, { label: string; icon: string }> = {
  rain: { label: 'Rain', icon: '💧' },
  snow: { label: 'Snow', icon: '❄️' },
  freezing_rain: { label: 'Freezing Rain', icon: '🧊' },
  showers: { label: 'Showers', icon: '🌧️' },
  thunderstorm: { label: 'Thunderstorm', icon: '⛈️' },
  none: { label: 'Clear', icon: '☀️' },
};

// Animation settings
export const ANIMATION_CONFIG = {
  frameInterval: 500,    // ms between frames
  frameCount: 4,         // number of frames (4 x 15-min = 1 hour)
  transitionDuration: 200, // ms for opacity transition
} as const;

// Cache settings
export const CACHE_CONFIG = {
  ttl: 5 * 60 * 1000,           // 5 minutes
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 10000,          // max cached cells
} as const;

// API settings
export const API_CONFIG = {
  batchSize: 100,               // max coordinates per request
  debounceMs: 300,              // viewport change debounce
  baseUrl: 'https://api.open-meteo.com/v1',
} as const;

// US bounding box for NBM model selection
export const US_BOUNDS = {
  north: 55,
  south: 20,
  east: -60,
  west: -135,
} as const;

// Default radar state
export const DEFAULT_RADAR_STATE = {
  isVisible: true,
  opacity: 0.7,
  layers: {
    intensity: true,
    type: true,
    movement: false,
  },
  isPlaying: false,
  currentFrameIndex: 0,
  lastUpdated: null,
} as const;
