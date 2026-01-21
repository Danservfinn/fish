/**
 * Inverse Distance Weighting (IDW) Interpolation
 * Creates smooth continuous surfaces from scattered point data
 */

export interface DataPoint {
  x: number; // longitude
  y: number; // latitude
  value: number;
}

export interface InterpolationOptions {
  power?: number; // IDW power parameter (default 2)
  smoothing?: number; // Smoothing factor (default 0)
  maxDistance?: number; // Maximum search radius
}

/**
 * Calculate IDW interpolated value at a single point
 */
export function interpolatePoint(
  x: number,
  y: number,
  points: DataPoint[],
  options: InterpolationOptions = {}
): number {
  const { power = 2, smoothing = 0, maxDistance = Infinity } = options;

  let weightSum = 0;
  let valueSum = 0;

  for (const point of points) {
    const dx = x - point.x;
    const dy = y - point.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Skip points beyond max distance
    if (distance > maxDistance) continue;

    // If we're exactly on a data point, return its value
    if (distance < 0.0001) {
      return point.value;
    }

    // IDW weight calculation
    const weight = 1 / Math.pow(distance + smoothing, power);
    weightSum += weight;
    valueSum += weight * point.value;
  }

  if (weightSum === 0) return 0;
  return valueSum / weightSum;
}

/**
 * Generate a grid of interpolated values
 */
export function interpolateGrid(
  points: DataPoint[],
  bounds: { west: number; east: number; north: number; south: number },
  width: number,
  height: number,
  options: InterpolationOptions = {}
): Float32Array {
  const grid = new Float32Array(width * height);

  const lonStep = (bounds.east - bounds.west) / width;
  const latStep = (bounds.north - bounds.south) / height;

  for (let row = 0; row < height; row++) {
    const lat = bounds.north - row * latStep;
    for (let col = 0; col < width; col++) {
      const lon = bounds.west + col * lonStep;
      const idx = row * width + col;
      grid[idx] = interpolatePoint(lon, lat, points, options);
    }
  }

  return grid;
}

/**
 * Fast approximation using spatial binning for large datasets
 */
export function interpolateGridFast(
  points: DataPoint[],
  bounds: { west: number; east: number; north: number; south: number },
  width: number,
  height: number,
  options: InterpolationOptions = {}
): Float32Array {
  const { power = 2 } = options;
  const grid = new Float32Array(width * height);

  const lonStep = (bounds.east - bounds.west) / width;
  const latStep = (bounds.north - bounds.south) / height;

  // Pre-calculate point positions in grid coordinates
  const gridPoints = points.map(p => ({
    col: (p.x - bounds.west) / lonStep,
    row: (bounds.north - p.y) / latStep,
    value: p.value,
  }));

  // For each pixel, calculate IDW
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      let weightSum = 0;
      let valueSum = 0;

      for (const point of gridPoints) {
        const dx = col - point.col;
        const dy = row - point.row;
        const distSq = dx * dx + dy * dy;

        if (distSq < 0.01) {
          // Very close to data point
          valueSum = point.value;
          weightSum = 1;
          break;
        }

        const weight = 1 / Math.pow(distSq, power / 2);
        weightSum += weight;
        valueSum += weight * point.value;
      }

      grid[row * width + col] = weightSum > 0 ? valueSum / weightSum : 0;
    }
  }

  return grid;
}
