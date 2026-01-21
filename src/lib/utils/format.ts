/**
 * Convert centimeters to inches
 */
export function cmToInches(cm: number | null): number | null {
  if (cm === null) return null;
  return Math.round(cm * 0.3937 * 10) / 10;
}

/**
 * Convert millimeters to inches
 */
export function mmToInches(mm: number | null): number | null {
  if (mm === null) return null;
  return Math.round((mm / 25.4) * 10) / 10;
}

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number | null): number | null {
  if (celsius === null) return null;
  return Math.round((celsius * 9) / 5 + 32);
}

/**
 * Format a number with unit
 */
export function formatWithUnit(value: number | null, unit: string, decimals = 1): string {
  if (value === null) return '--';
  return `${value.toFixed(decimals)}${unit}`;
}

/**
 * Format temperature
 */
export function formatTemp(celsius: number | null, useMetric = false): string {
  if (celsius === null) return '--';
  if (useMetric) {
    return `${Math.round(celsius)}°C`;
  }
  return `${celsiusToFahrenheit(celsius)}°F`;
}

/**
 * Format snow amount
 */
export function formatSnow(cm: number | null, useMetric = false): string {
  if (cm === null) return '--';
  if (useMetric) {
    return `${cm.toFixed(1)} cm`;
  }
  const inches = cmToInches(cm);
  return inches !== null ? `${inches}"` : '--';
}

/**
 * Format precipitation
 */
export function formatPrecip(mm: number | null, useMetric = false): string {
  if (mm === null) return '--';
  if (useMetric) {
    return `${mm.toFixed(1)} mm`;
  }
  const inches = mmToInches(mm);
  return inches !== null ? `${inches}"` : '--';
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Format time for display
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Round coordinates for caching
 */
export function roundCoordinate(coord: number, precision = 2): number {
  return Math.round(coord * Math.pow(10, precision)) / Math.pow(10, precision);
}
