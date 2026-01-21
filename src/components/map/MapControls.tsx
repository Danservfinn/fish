'use client';

import { Layers, Radio, CloudSnow, CloudRain, Droplets } from 'lucide-react';
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
    <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
      {/* Map Mode Toggle */}
      <div
        className="rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, rgba(10,10,15,0.95) 0%, rgba(20,20,30,0.92) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="p-1">
          <button
            onClick={() => onMapModeChange('accumulation')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              mapMode === 'accumulation'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20'
                : 'hover:bg-white/5'
            }`}
            style={{
              boxShadow: mapMode === 'accumulation'
                ? '0 0 20px rgba(6,182,212,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                : 'none',
            }}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                mapMode === 'accumulation'
                  ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/30'
                  : 'bg-white/5'
              }`}
            >
              <Layers className={`w-4 h-4 ${mapMode === 'accumulation' ? 'text-white' : 'text-white/50'}`} />
            </div>
            <div className="flex-1 text-left">
              <div className={`text-xs font-semibold ${mapMode === 'accumulation' ? 'text-white' : 'text-white/60'}`}>
                Accumulation
              </div>
              <div className="text-[10px] text-white/30">7-day totals</div>
            </div>
            {mapMode === 'accumulation' && (
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50" />
            )}
          </button>

          <button
            onClick={() => onMapModeChange('live')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              mapMode === 'live'
                ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20'
                : 'hover:bg-white/5'
            }`}
            style={{
              boxShadow: mapMode === 'live'
                ? '0 0 20px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                : 'none',
            }}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                mapMode === 'live'
                  ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/30'
                  : 'bg-white/5'
              }`}
            >
              <Radio className={`w-4 h-4 ${mapMode === 'live' ? 'text-white' : 'text-white/50'}`} />
            </div>
            <div className="flex-1 text-left">
              <div className={`text-xs font-semibold ${mapMode === 'live' ? 'text-white' : 'text-white/60'}`}>
                Live Radar
              </div>
              <div className="text-[10px] text-white/30">Current precip</div>
            </div>
            {mapMode === 'live' && (
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
            )}
          </button>
        </div>
      </div>

      {/* Precipitation Type Selector (only for accumulation mode) */}
      {mapMode === 'accumulation' && (
        <div
          className="rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(180deg, rgba(10,10,15,0.95) 0%, rgba(20,20,30,0.92) 100%)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="p-1.5 flex gap-1">
            <button
              onClick={() => onPrecipModeChange('snow')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                precipMode === 'snow'
                  ? 'bg-gradient-to-br from-blue-500/30 to-purple-500/20'
                  : 'hover:bg-white/5'
              }`}
            >
              <CloudSnow className={`w-4 h-4 ${precipMode === 'snow' ? 'text-blue-300' : 'text-white/40'}`} />
              <span className={`text-[11px] font-medium ${precipMode === 'snow' ? 'text-white' : 'text-white/50'}`}>
                Snow
              </span>
            </button>
            <button
              onClick={() => onPrecipModeChange('rain')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                precipMode === 'rain'
                  ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/20'
                  : 'hover:bg-white/5'
              }`}
            >
              <CloudRain className={`w-4 h-4 ${precipMode === 'rain' ? 'text-green-300' : 'text-white/40'}`} />
              <span className={`text-[11px] font-medium ${precipMode === 'rain' ? 'text-white' : 'text-white/50'}`}>
                Rain
              </span>
            </button>
            <button
              onClick={() => onPrecipModeChange('total')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                precipMode === 'total'
                  ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/20'
                  : 'hover:bg-white/5'
              }`}
            >
              <Droplets className={`w-4 h-4 ${precipMode === 'total' ? 'text-amber-300' : 'text-white/40'}`} />
              <span className={`text-[11px] font-medium ${precipMode === 'total' ? 'text-white' : 'text-white/50'}`}>
                All
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Layer Toggle */}
      <button
        onClick={() => onLayerVisibleChange(!layerVisible)}
        className="rounded-xl overflow-hidden shadow-2xl transition-all"
        style={{
          background: layerVisible
            ? 'linear-gradient(180deg, rgba(6,182,212,0.2) 0%, rgba(20,20,30,0.95) 100%)'
            : 'linear-gradient(180deg, rgba(10,10,15,0.95) 0%, rgba(20,20,30,0.92) 100%)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${layerVisible ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.06)'}`,
        }}
      >
        <div className="px-3 py-2.5 flex items-center gap-2">
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
              layerVisible ? 'bg-cyan-500/30' : 'bg-white/5'
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-sm transition-all ${
                layerVisible ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50' : 'bg-white/20'
              }`}
            />
          </div>
          <span className={`text-[11px] font-medium ${layerVisible ? 'text-white' : 'text-white/50'}`}>
            Show Layer
          </span>
        </div>
      </button>
    </div>
  );
}
