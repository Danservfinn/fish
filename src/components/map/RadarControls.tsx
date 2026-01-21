'use client';

import { Eye, EyeOff, Play, Pause, RefreshCw, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { RadarLayerState } from '@/types/precipitation';

interface RadarControlsProps {
  isVisible: boolean;
  opacity: number;
  layers: RadarLayerState;
  isPlaying: boolean;
  isLoading: boolean;
  lastUpdated: Date | null;
  frameCount: number;
  currentFrameIndex: number;
  onToggleVisibility: () => void;
  onOpacityChange: (value: number) => void;
  onToggleLayer: (layer: keyof RadarLayerState) => void;
  onTogglePlay: () => void;
  onRefresh: () => void;
  onFrameChange: (index: number) => void;
}

export default function RadarControls({
  isVisible,
  opacity,
  layers,
  isPlaying,
  isLoading,
  lastUpdated,
  frameCount,
  currentFrameIndex,
  onToggleVisibility,
  onOpacityChange,
  onToggleLayer,
  onTogglePlay,
  onRefresh,
  onFrameChange,
}: RadarControlsProps) {
  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="bg-background/90 backdrop-blur-sm border-border/50 w-56">
      <CardContent className="p-3 space-y-3">
        {/* Header with visibility toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Radar</span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh data</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onToggleVisibility}
                >
                  {isVisible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isVisible ? 'Hide radar' : 'Show radar'}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {isVisible && (
          <>
            {/* Opacity slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Opacity</span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              <Slider
                value={[opacity]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={([value]) => onOpacityChange(value)}
                className="w-full"
              />
            </div>

            {/* Layer toggles */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <Layers className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Layers</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={layers.intensity ? 'secondary' : 'outline'}
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => onToggleLayer('intensity')}
                >
                  Intensity
                </Button>
                <Button
                  variant={layers.type ? 'secondary' : 'outline'}
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => onToggleLayer('type')}
                >
                  Type
                </Button>
                <Button
                  variant={layers.movement ? 'secondary' : 'outline'}
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => onToggleLayer('movement')}
                >
                  Movement
                </Button>
              </div>
            </div>

            {/* Animation controls */}
            {frameCount > 1 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Animation</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onTogglePlay}
                  >
                    {isPlaying ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <Slider
                  value={[currentFrameIndex]}
                  min={0}
                  max={frameCount - 1}
                  step={1}
                  onValueChange={([value]) => onFrameChange(value)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>-1hr</span>
                  <span>Now</span>
                </div>
              </div>
            )}

            {/* Last updated */}
            <div className="text-xs text-muted-foreground text-center pt-1 border-t border-border/50">
              Updated: {formatLastUpdated(lastUpdated)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
