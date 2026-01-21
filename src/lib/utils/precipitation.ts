import type {
  PrecipitationType,
  PrecipitationCell,
  PrecipitationGeoJSON,
  PrecipitationFeature,
  GridConfig,
} from '@/types/precipitation';
import {
  PRECIPITATION_COLORS,
  PRECIPITATION_THRESHOLDS,
  WEATHER_CODE_TO_TYPE,
  ZOOM_THRESHOLDS,
  GRID_RESOLUTIONS,
} from '@/constants/precipitation';

/**
 * Maps precipitation rate (mm/hr) to a color hex string
 */
export function getPrecipitationColor(rate: number): string {
  if (rate < PRECIPITATION_THRESHOLDS.light) {
    return PRECIPITATION_COLORS.none;
  }
  if (rate < PRECIPITATION_THRESHOLDS.moderate) {
    return PRECIPITATION_COLORS.light;
  }
  if (rate < PRECIPITATION_THRESHOLDS.heavy) {
    return PRECIPITATION_COLORS.moderate;
  }
  if (rate < PRECIPITATION_THRESHOLDS.veryHeavy) {
    return PRECIPITATION_COLORS.heavy;
  }
  if (rate < PRECIPITATION_THRESHOLDS.extreme) {
    return PRECIPITATION_COLORS.veryHeavy;
  }
  return PRECIPITATION_COLORS.extreme;
}

/**
 * Maps precipitation rate to an intensity label
 */
export function getPrecipitationIntensity(rate: number): string {
  if (rate < PRECIPITATION_THRESHOLDS.light) return 'none';
  if (rate < PRECIPITATION_THRESHOLDS.moderate) return 'light';
  if (rate < PRECIPITATION_THRESHOLDS.heavy) return 'moderate';
  if (rate < PRECIPITATION_THRESHOLDS.veryHeavy) return 'heavy';
  if (rate < PRECIPITATION_THRESHOLDS.extreme) return 'veryHeavy';
  return 'extreme';
}

/**
 * Maps WMO weather code to precipitation type
 */
export function getPrecipitationType(weatherCode: number): PrecipitationType {
  return WEATHER_CODE_TO_TYPE[weatherCode] ?? 'none';
}

/**
 * Calculates opacity based on precipitation rate (0-1)
 */
export function getPrecipitationOpacity(rate: number): number {
  if (rate < PRECIPITATION_THRESHOLDS.light) return 0;
  if (rate < PRECIPITATION_THRESHOLDS.moderate) return 0.4;
  if (rate < PRECIPITATION_THRESHOLDS.heavy) return 0.5;
  if (rate < PRECIPITATION_THRESHOLDS.veryHeavy) return 0.6;
  if (rate < PRECIPITATION_THRESHOLDS.extreme) return 0.7;
  return 0.8;
}

/**
 * Gets grid resolution based on zoom level
 */
export function getGridResolution(zoom: number): number {
  if (zoom <= ZOOM_THRESHOLDS.lowToMedium) {
    return GRID_RESOLUTIONS.low;
  }
  if (zoom <= ZOOM_THRESHOLDS.mediumToHigh) {
    return GRID_RESOLUTIONS.medium;
  }
  return GRID_RESOLUTIONS.high;
}

/**
 * Calculates grid points for a given viewport bounds and zoom level
 */
export function calculateGrid(
  bounds: { north: number; south: number; east: number; west: number },
  zoom: number
): GridConfig {
  const resolution = getGridResolution(zoom);
  const points: Array<{ lat: number; lon: number }> = [];

  // Add some padding to ensure we cover the edges
  const padding = resolution * 0.5;
  const paddedBounds = {
    north: Math.min(90, bounds.north + padding),
    south: Math.max(-90, bounds.south - padding),
    east: Math.min(180, bounds.east + padding),
    west: Math.max(-180, bounds.west - padding),
  };

  // Calculate starting points aligned to grid
  const startLat = Math.floor(paddedBounds.south / resolution) * resolution;
  const startLon = Math.floor(paddedBounds.west / resolution) * resolution;

  // Generate grid points
  for (let lat = startLat; lat <= paddedBounds.north; lat += resolution) {
    for (let lon = startLon; lon <= paddedBounds.east; lon += resolution) {
      // Handle longitude wrapping
      let normalizedLon = lon;
      if (normalizedLon > 180) normalizedLon -= 360;
      if (normalizedLon < -180) normalizedLon += 360;

      points.push({ lat, lon: normalizedLon });
    }
  }

  // Limit max grid size to prevent excessive API calls
  const maxPoints = 500;
  if (points.length > maxPoints) {
    // Sample evenly from the points
    const step = Math.ceil(points.length / maxPoints);
    const sampledPoints = points.filter((_, i) => i % step === 0);
    return { resolution, bounds: paddedBounds, points: sampledPoints };
  }

  return { resolution, bounds: paddedBounds, points };
}

/**
 * Converts precipitation data to GeoJSON format for MapLibre
 */
export function buildPrecipitationGeoJSON(
  cells: PrecipitationCell[]
): PrecipitationGeoJSON {
  const features: PrecipitationFeature[] = cells.map(cell => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [cell.lon, cell.lat],
    },
    properties: {
      rate: cell.rate,
      type: cell.type,
      weatherCode: cell.weatherCode,
      color: cell.color,
      opacity: getPrecipitationOpacity(cell.rate),
      model: cell.model,
      nextHourForecast: cell.nextHourForecast,
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Calculates movement vectors between two consecutive frames
 */
export function calculateMovementVectors(
  prevCells: PrecipitationCell[],
  currentCells: PrecipitationCell[]
): Map<string, { angle: number; speed: number }> {
  const movements = new Map<string, { angle: number; speed: number }>();

  // For each current cell with precipitation, try to find nearby cells
  // that had precipitation in the previous frame
  for (const cell of currentCells) {
    if (cell.rate < PRECIPITATION_THRESHOLDS.light) continue;

    const key = `${cell.lat.toFixed(2)},${cell.lon.toFixed(2)}`;

    // Look for the nearest cell in the previous frame that had precipitation
    // Use reduce to find the best match with proper TypeScript inference
    const bestMatch = prevCells
      .filter(prevCell => prevCell.rate >= PRECIPITATION_THRESHOLDS.light)
      .reduce<{ cell: PrecipitationCell | null; distance: number }>(
        (best, prevCell) => {
          const dLat = cell.lat - prevCell.lat;
          const dLon = cell.lon - prevCell.lon;
          const distance = Math.sqrt(dLat * dLat + dLon * dLon);

          // Only consider cells within a reasonable range (e.g., 2 degrees)
          if (distance < 2 && distance < best.distance) {
            return { cell: prevCell, distance };
          }
          return best;
        },
        { cell: null, distance: Infinity }
      );

    if (bestMatch.cell && bestMatch.distance > 0.01) {
      const dLat = cell.lat - bestMatch.cell.lat;
      const dLon = cell.lon - bestMatch.cell.lon;

      // Calculate angle (0 = east, 90 = north)
      const angle = Math.atan2(dLat, dLon) * (180 / Math.PI);

      // Calculate speed (approximate km/h, assuming 15-minute intervals)
      // 1 degree ≈ 111 km at equator
      const distanceKm = bestMatch.distance * 111;
      const speed = distanceKm * 4; // 4 intervals per hour

      movements.set(key, { angle, speed });
    }
  }

  return movements;
}

/**
 * Formats precipitation rate for display
 */
export function formatPrecipitationRate(rate: number): string {
  if (rate < 0.1) return '0 mm/hr';
  if (rate < 1) return `${rate.toFixed(2)} mm/hr`;
  return `${rate.toFixed(1)} mm/hr`;
}

/**
 * Converts mm to inches for US display
 */
export function mmToInches(mm: number): number {
  return mm / 25.4;
}

/**
 * Formats precipitation rate in inches for US users
 */
export function formatPrecipitationRateInches(rate: number): string {
  const inches = mmToInches(rate);
  if (inches < 0.01) return '0 in/hr';
  if (inches < 0.1) return `${inches.toFixed(3)} in/hr`;
  return `${inches.toFixed(2)} in/hr`;
}
