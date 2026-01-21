'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PRECIPITATION_COLORS, PRECIPITATION_LABELS } from '@/constants/precipitation';

interface RadarLegendProps {
  isVisible: boolean;
}

export default function RadarLegend({ isVisible }: RadarLegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) return null;

  const colorEntries = [
    { key: 'extreme', color: PRECIPITATION_COLORS.extreme },
    { key: 'veryHeavy', color: PRECIPITATION_COLORS.veryHeavy },
    { key: 'heavy', color: PRECIPITATION_COLORS.heavy },
    { key: 'moderate', color: PRECIPITATION_COLORS.moderate },
    { key: 'light', color: PRECIPITATION_COLORS.light },
  ];

  return (
    <Card className="bg-background/90 backdrop-blur-sm border-border/50">
      <CardContent className="p-2">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Precipitation (mm/hr)
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>

        {!isCollapsed && (
          <div className="space-y-1">
            {colorEntries.map(({ key, color }) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-4 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-muted-foreground">
                  {PRECIPITATION_LABELS[key]}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
