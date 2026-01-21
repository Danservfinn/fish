'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import type { AgreementResult } from '@/types/forecast';
import { formatSnow } from '@/lib/utils/format';

interface ModelAgreementMeterProps {
  agreement: AgreementResult;
}

export default function ModelAgreementMeter({ agreement }: ModelAgreementMeterProps) {
  const levelLabels = {
    high: 'HIGH',
    moderate: 'MODERATE',
    low: 'LOW',
  };

  return (
    <Card>
      <CardContent className="pt-4 px-3 md:px-6">
        <div className="space-y-3">
          {/* Agreement bar - stacked on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-sm text-muted-foreground">Model Agreement</span>
              <span className={`text-xs font-bold px-2 py-1 rounded sm:hidden ${
                agreement.level === 'high' ? 'bg-green-500/20 text-green-400' :
                agreement.level === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {levelLabels[agreement.level]}
              </span>
            </div>
            <div className="flex-1 relative">
              <Progress
                value={agreement.percentage}
                className="h-3"
              />
            </div>
            <span className={`hidden sm:inline-block text-xs font-bold px-2 py-1 rounded ${
              agreement.level === 'high' ? 'bg-green-500/20 text-green-400' :
              agreement.level === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {levelLabels[agreement.level]}
            </span>
          </div>

          {/* Range and estimate */}
          <div className="flex justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Range: </span>
              <span className="font-medium">
                {formatSnow(agreement.range[0])} - {formatSnow(agreement.range[1])}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Best Est: </span>
              <span className="font-bold text-primary">
                {formatSnow(agreement.bestEstimate)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
