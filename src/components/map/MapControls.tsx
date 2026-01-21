'use client';

import { Layers, Radio, CloudSnow, CloudRain, Droplets, Eye, EyeOff } from 'lucide-react';
import type { PrecipMode } from '@/types/forecast';

export type MapMode = 'accumulation' | 'live';

interface MapControlsProps {
  mapMode: MapMode;
  onMapModeChange: (mode: MapMode) => void;
  precipMode: PrecipMode;
  onPrecipModeChange: (mode: PrecipMode) => void;
  layerVisible: boolean;
  onLayerVisibleChange: (visible: boolean) => void;
}

export default function MapControls({
  mapMode,
  onMapModeChange,
  precipMode,
  onPrecipModeChange,
  layerVisible,
  onLayerVisibleChange,
}: MapControlsProps) {
  return (
    <div className="absolute top-20 right-4 z-10 flex flex-col gap-2.5">
      {/* ═══════════════════════════════════════════════
          Map Mode Toggle - Accumulation vs Live Radar
          ═══════════════════════════════════════════════ */}
      <div
        className="
          rounded-xl overflow-hidden
          bg-card/95 dark:bg-card/90
          backdrop-blur-xl
          border border-border/50
          shadow-lg shadow-black/5 dark:shadow-black/20
        "
      >
        <div className="p-1.5 space-y-1">
          {/* Accumulation Mode */}
          <button
            onClick={() => onMapModeChange('accumulation')}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-all duration-200
              ${mapMode === 'accumulation'
                ? 'bg-primary/10 dark:bg-primary/15'
                : 'hover:bg-muted/50'
              }
            `}
          >
            <div
              className={`
                w-9 h-9 rounded-lg flex items-center justify-center
                transition-all duration-200
                ${mapMode === 'accumulation'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted/60 text-muted-foreground'
                }
              `}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left">
              <div className={`text-sm font-medium ${mapMode === 'accumulation' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Accumulation
              </div>
              <div className="text-[10px] text-muted-foreground">7-day forecast totals</div>
            </div>
            {mapMode === 'accumulation' && (
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>

          {/* Live Radar Mode */}
          <button
            onClick={() => onMapModeChange('live')}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-all duration-200
              ${mapMode === 'live'
                ? 'bg-emerald-500/10 dark:bg-emerald-500/15'
                : 'hover:bg-muted/50'
              }
            `}
          >
            <div
              className={`
                w-9 h-9 rounded-lg flex items-center justify-center
                transition-all duration-200
                ${mapMode === 'live'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-muted/60 text-muted-foreground'
                }
              `}
            >
              <Radio className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left">
              <div className={`text-sm font-medium ${mapMode === 'live' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Live Radar
              </div>
              <div className="text-[10px] text-muted-foreground">Current precipitation</div>
            </div>
            {mapMode === 'live' && (
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          Precipitation Type Selector (Accumulation Mode Only)
          Miller's Law: 3 options max in a single control
          ═══════════════════════════════════════════════ */}
      {mapMode === 'accumulation' && (
        <div
          className="
            rounded-xl overflow-hidden
            bg-card/95 dark:bg-card/90
            backdrop-blur-xl
            border border-border/50
            shadow-lg shadow-black/5 dark:shadow-black/20
          "
        >
          <div className="p-1.5 flex gap-1">
            <PrecipButton
              active={precipMode === 'snow'}
              onClick={() => onPrecipModeChange('snow')}
              icon={<CloudSnow className="w-4 h-4" />}
              label="Snow"
              activeColor="blue"
            />
            <PrecipButton
              active={precipMode === 'rain'}
              onClick={() => onPrecipModeChange('rain')}
              icon={<CloudRain className="w-4 h-4" />}
              label="Rain"
              activeColor="green"
            />
            <PrecipButton
              active={precipMode === 'total'}
              onClick={() => onPrecipModeChange('total')}
              icon={<Droplets className="w-4 h-4" />}
              label="All"
              activeColor="amber"
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          Layer Visibility Toggle
          ═══════════════════════════════════════════════ */}
      <button
        onClick={() => onLayerVisibleChange(!layerVisible)}
        className={`
          rounded-xl overflow-hidden
          bg-card/95 dark:bg-card/90
          backdrop-blur-xl
          border transition-all duration-200
          shadow-lg shadow-black/5 dark:shadow-black/20
          ${layerVisible
            ? 'border-primary/30'
            : 'border-border/50'
          }
        `}
      >
        <div className="px-3 py-2.5 flex items-center gap-2.5">
          <div
            className={`
              w-6 h-6 rounded-md flex items-center justify-center
              transition-all duration-200
              ${layerVisible
                ? 'bg-primary/15 text-primary'
                : 'bg-muted/60 text-muted-foreground'
              }
            `}
          >
            {layerVisible ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </div>
          <span className={`text-xs font-medium ${layerVisible ? 'text-foreground' : 'text-muted-foreground'}`}>
            {layerVisible ? 'Layer On' : 'Layer Off'}
          </span>
        </div>
      </button>
    </div>
  );
}

// Precipitation type button component
function PrecipButton({
  active,
  onClick,
  icon,
  label,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeColor: 'blue' | 'green' | 'amber';
}) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/15 dark:bg-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    amber: {
      bg: 'bg-amber-500/15 dark:bg-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
    },
  }[activeColor];

  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex items-center justify-center gap-1.5
        px-3 py-2 rounded-lg
        transition-all duration-200
        ${active
          ? `${colorClasses.bg} ${colorClasses.text}`
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        }
      `}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
