'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ExternalLink, Info } from 'lucide-react';
import { MODEL_INFO, MODEL_COLORS, type ModelName } from '@/types/forecast';

interface ModelTooltipProps {
  model: ModelName;
  children: React.ReactNode;
  showInfoIcon?: boolean;
}

export default function ModelTooltip({ model, children, showInfoIcon = true }: ModelTooltipProps) {
  const info = MODEL_INFO[model];
  const color = MODEL_COLORS[model];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {children}
            {showInfoIcon && (
              <Info className="w-3 h-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-xs p-0 bg-card border-border"
        >
          <div className="p-3 space-y-2">
            {/* Header with color indicator */}
            <div className="flex items-start gap-2">
              <div
                className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <div>
                <div className="font-semibold text-foreground">{info.fullName}</div>
                <div className="text-xs text-muted-foreground">{info.organization}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Resolution: </span>
                <span className="font-medium">{info.resolution}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Range: </span>
                <span className="font-medium">{info.range}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {info.description}
            </p>

            {/* Link to source */}
            <a
              href={info.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Learn more
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
