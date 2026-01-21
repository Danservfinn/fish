/**
 * Precipitation Raster Renderer
 * Creates NWS-style banded precipitation maps using canvas
 */

import { interpolateGridFast, type DataPoint } from './idw-interpolation';
import type { PrecipMode } from '@/types/forecast';

// NWS-style snow color bands (inches)
const SNOW_COLOR_BANDS = [
  { max: 0.1, color: [255, 255, 255, 0] },      // Trace - transparent
  { max: 1, color: [225, 240, 255, 180] },      // <1" - very light blue
  { max: 2, color: [200, 225, 255, 200] },      // 1-2" - light blue
  { max: 3, color: [170, 200, 255, 210] },      // 2-3" - light-medium blue
  { max: 4, color: [135, 170, 235, 220] },      // 3-4" - medium blue
  { max: 6, color: [100, 140, 210, 230] },      // 4-6" - medium-dark blue
  { max: 8, color: [70, 100, 180, 235] },       // 6-8" - dark blue
  { max: 10, color: [80, 60, 150, 240] },       // 8-10" - purple-blue
  { max: 12, color: [100, 50, 130, 245] },      // 10-12" - purple
  { max: 18, color: [200, 150, 100, 250] },     // 12-18" - tan/orange
  { max: 24, color: [220, 120, 80, 250] },      // 18-24" - orange
  { max: Infinity, color: [240, 80, 80, 255] }, // 24"+ - red
];

// NWS-style rain color bands (inches)
const RAIN_COLOR_BANDS = [
  { max: 0.01, color: [255, 255, 255, 0] },     // Trace - transparent
  { max: 0.1, color: [200, 255, 200, 150] },    // <0.1" - very light green
  { max: 0.25, color: [150, 235, 150, 180] },   // 0.1-0.25" - light green
  { max: 0.5, color: [100, 200, 100, 200] },    // 0.25-0.5" - green
  { max: 1, color: [50, 170, 50, 220] },        // 0.5-1" - dark green
  { max: 1.5, color: [255, 255, 100, 230] },    // 1-1.5" - yellow
  { max: 2, color: [255, 200, 50, 235] },       // 1.5-2" - gold
  { max: 3, color: [255, 140, 0, 240] },        // 2-3" - orange
  { max: 4, color: [255, 80, 0, 245] },         // 3-4" - dark orange
  { max: Infinity, color: [200, 0, 0, 255] },   // 4"+ - red
];

/**
 * Get color for a precipitation value
 */
function getColorForValue(value: number, mode: PrecipMode): [number, number, number, number] {
  const bands = mode === 'snow' ? SNOW_COLOR_BANDS : RAIN_COLOR_BANDS;

  for (const band of bands) {
    if (value < band.max) {
      return band.color as [number, number, number, number];
    }
  }

  return bands[bands.length - 1].color as [number, number, number, number];
}

/**
 * Render precipitation data to a canvas
 */
export function renderPrecipitationCanvas(
  points: DataPoint[],
  bounds: { west: number; east: number; north: number; south: number },
  width: number,
  height: number,
  mode: PrecipMode
): HTMLCanvasElement {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Skip if no data
  if (points.length === 0) {
    return canvas;
  }

  // Interpolate grid values
  const grid = interpolateGridFast(points, bounds, width, height, { power: 2.5 });

  // Create image data
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Fill pixels with colors
  for (let i = 0; i < grid.length; i++) {
    const value = grid[i];
    const color = getColorForValue(value, mode);

    const pixelIndex = i * 4;
    data[pixelIndex] = color[0];     // R
    data[pixelIndex + 1] = color[1]; // G
    data[pixelIndex + 2] = color[2]; // B
    data[pixelIndex + 3] = color[3]; // A
  }

  // Put image data on canvas
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

/**
 * Convert canvas to data URL for MapLibre ImageSource
 */
export function canvasToDataURL(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Render precipitation data and return as data URL
 */
export function renderPrecipitationImage(
  points: DataPoint[],
  bounds: { west: number; east: number; north: number; south: number },
  width: number,
  height: number,
  mode: PrecipMode
): string {
  const canvas = renderPrecipitationCanvas(points, bounds, width, height, mode);
  return canvasToDataURL(canvas);
}

export { SNOW_COLOR_BANDS, RAIN_COLOR_BANDS };
