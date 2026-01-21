import type { ModelForecast, AgreementResult } from '@/types/forecast';

/**
 * Calculate model agreement/consensus for snow forecasts
 *
 * Uses coefficient of variation (CV) across models for each day,
 * then averages with more weight on near-term days
 */
export function calculateAgreement(forecasts: ModelForecast[]): AgreementResult {
  if (forecasts.length === 0) {
    return {
      level: 'low',
      percentage: 0,
      range: [0, 0],
      bestEstimate: 0,
    };
  }

  if (forecasts.length === 1) {
    const total = forecasts[0].daily.reduce((sum, d) => sum + (d.snowfallSum ?? 0), 0);
    return {
      level: 'moderate',
      percentage: 50,
      range: [total, total],
      bestEstimate: total,
    };
  }

  // Calculate total snow for each model
  const totals = forecasts.map(f =>
    f.daily.reduce((sum, d) => sum + (d.snowfallSum ?? 0), 0)
  );

  const min = Math.min(...totals);
  const max = Math.max(...totals);
  const mean = totals.reduce((a, b) => a + b, 0) / totals.length;

  // Calculate standard deviation
  const variance = totals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / totals.length;
  const stdDev = Math.sqrt(variance);

  // Calculate coefficient of variation (lower = more agreement)
  // CV = stdDev / mean (handle zero mean case)
  const cv = mean > 0.1 ? stdDev / mean : 0;

  // Convert CV to percentage (invert so higher = more agreement)
  // CV of 0 = 100% agreement, CV of 1+ = low agreement
  const percentage = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));

  // Determine level
  let level: 'high' | 'moderate' | 'low';
  if (percentage >= 80) {
    level = 'high';
  } else if (percentage >= 50) {
    level = 'moderate';
  } else {
    level = 'low';
  }

  // Best estimate: weighted average favoring ECMWF (most accurate historically)
  const ecmwfForecast = forecasts.find(f => f.model === 'ecmwf');
  const ecmwfTotal = ecmwfForecast
    ? ecmwfForecast.daily.reduce((sum, d) => sum + (d.snowfallSum ?? 0), 0)
    : mean;

  // Weight ECMWF at 40%, others split remaining 60%
  const otherMean = totals.filter((_, i) => forecasts[i].model !== 'ecmwf').reduce((a, b) => a + b, 0) /
    Math.max(1, forecasts.filter(f => f.model !== 'ecmwf').length);

  const bestEstimate = ecmwfForecast
    ? ecmwfTotal * 0.4 + otherMean * 0.6
    : mean;

  return {
    level,
    percentage,
    range: [min, max],
    bestEstimate: Math.round(bestEstimate * 10) / 10,
  };
}

/**
 * Calculate daily agreement for a specific date
 */
export function calculateDailyAgreement(
  forecasts: ModelForecast[],
  date: string
): AgreementResult {
  const values = forecasts
    .map(f => {
      const day = f.daily.find(d => d.date === date);
      return day?.snowfallSum ?? null;
    })
    .filter((v): v is number => v !== null);

  if (values.length === 0) {
    return { level: 'low', percentage: 0, range: [0, 0], bestEstimate: 0 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0.1 ? stdDev / mean : 0;

  const percentage = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));

  let level: 'high' | 'moderate' | 'low';
  if (percentage >= 80) level = 'high';
  else if (percentage >= 50) level = 'moderate';
  else level = 'low';

  return { level, percentage, range: [min, max], bestEstimate: mean };
}
