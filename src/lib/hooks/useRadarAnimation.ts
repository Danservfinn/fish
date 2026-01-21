'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  PrecipitationGeoJSON,
  AnimationFrame,
  PrecipitationCell,
} from '@/types/precipitation';
import { getCachedMinutely15 } from '@/lib/api/precipitation';
import { buildPrecipitationGeoJSON, getPrecipitationColor } from '@/lib/utils/precipitation';
import { ANIMATION_CONFIG } from '@/constants/precipitation';

interface UseRadarAnimationReturn {
  currentFrame: PrecipitationGeoJSON | null;
  currentFrameIndex: number;
  frameCount: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setFrame: (index: number) => void;
  frameTimestamp: string | null;
}

export function useRadarAnimation(
  baseData: PrecipitationCell[],
  resolution: number
): UseRadarAnimationReturn {
  const [frames, setFrames] = useState<AnimationFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Build animation frames from minutely_15 data
  useEffect(() => {
    if (baseData.length === 0) {
      setFrames([]);
      return;
    }

    // Build frames for animation
    const newFrames: AnimationFrame[] = [];

    // Get the first cell's minutely data to determine timestamps
    const firstCell = baseData[0];
    const minutelyData = getCachedMinutely15(firstCell.lat, firstCell.lon, resolution);

    if (!minutelyData || minutelyData.length === 0) {
      // No minutely data, just use current data as single frame
      newFrames.push({
        timestamp: new Date().toISOString(),
        data: buildPrecipitationGeoJSON(baseData),
      });
    } else {
      // Build frames for each 15-minute interval (up to 4 frames = 1 hour)
      const frameCount = Math.min(minutelyData.length, ANIMATION_CONFIG.frameCount);

      for (let i = 0; i < frameCount; i++) {
        const frameCells: PrecipitationCell[] = baseData.map(cell => {
          const cellMinutely = getCachedMinutely15(cell.lat, cell.lon, resolution);
          const rate = cellMinutely?.[i]?.rate ?? cell.rate;

          return {
            ...cell,
            rate,
            color: getPrecipitationColor(rate),
            type: rate > 0.1 ? cell.type : 'none',
          };
        });

        newFrames.push({
          timestamp: minutelyData[i]?.time ?? new Date().toISOString(),
          data: buildPrecipitationGeoJSON(frameCells),
        });
      }
    }

    setFrames(newFrames);
    setCurrentFrameIndex(0);
  }, [baseData, resolution]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (timestamp - lastFrameTimeRef.current >= ANIMATION_CONFIG.frameInterval) {
        setCurrentFrameIndex(prev => (prev + 1) % frames.length);
        lastFrameTimeRef.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, frames.length]);

  const play = useCallback(() => {
    if (frames.length > 1) {
      setIsPlaying(true);
    }
  }, [frames.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    setIsPlaying(prev => !prev && frames.length > 1);
  }, [frames.length]);

  const setFrame = useCallback((index: number) => {
    if (index >= 0 && index < frames.length) {
      setCurrentFrameIndex(index);
      setIsPlaying(false);
    }
  }, [frames.length]);

  return {
    currentFrame: frames[currentFrameIndex]?.data ?? null,
    currentFrameIndex,
    frameCount: frames.length,
    isPlaying,
    play,
    pause,
    toggle,
    setFrame,
    frameTimestamp: frames[currentFrameIndex]?.timestamp ?? null,
  };
}
