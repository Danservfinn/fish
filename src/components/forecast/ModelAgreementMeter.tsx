'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import type { AgreementResult } from '@/types/forecast';
import { formatSnow } from '@/lib/utils/format';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface ModelAgreementMeterProps {
  agreement: AgreementResult;
}

export default function ModelAgreementMeter({ agreement }: ModelAgreementMeterProps) {
  const levelConfig = {
    high: {
      label: 'High Confidence',
      icon: CheckCircle,
      bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      borderClass: 'border-emerald-500/20',
      progressClass: 'bg-emerald-500',
    },
    moderate: {
      label: 'Moderate',
      icon: AlertCircle,
      bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
      textClass: 'text-amber-600 dark:text-amber-400',
      borderClass: 'border-amber-500/20',
      progressClass: 'bg-amber-500',
    },
    low: {
      label: 'Low Confidence',
      icon: XCircle,
      bgClass: 'bg-red-500/10 dark:bg-red-500/15',
      textClass: 'text-red-600 dark:text-red-400',
      borderClass: 'border-red-500/20',
      progressClass: 'bg-red-500',
    },
  }[agreement.level];

  const Icon = levelConfig.icon;

  return (
    <Card className={`border-border/50 shadow-sm ${levelConfig.borderClass}`}>
      <CardContent className="pt-4 px-4 md:px-5">
        <div className="space-y-4">
          {/* Header with confidence badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${levelConfig.textClass}`} />
              <span className="text-sm font-medium text-foreground">Model Agreement</span>
            </div>
            <span className={`
              text-xs font-semibold px-2.5 py-1 rounded-full
              ${levelConfig.bgClass} ${levelConfig.textClass}
            `}>
              {levelConfig.label}
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <Progress
              value={agreement.percentage}
              className="h-2.5 bg-muted/50"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Low agreement</span>
              <span>High agreement</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Range
              </div>
              <div className="font-data text-sm font-semibold text-foreground">
                {formatSnow(agreement.range[0])} – {formatSnow(agreement.range[1])}
              </div>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div className="space-y-0.5 text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Best Estimate
              </div>
              <div className="font-data text-sm font-bold text-primary">
                {formatSnow(agreement.bestEstimate)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
