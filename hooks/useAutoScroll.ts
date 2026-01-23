/**
 * useAutoScroll Hook
 * ========================================
 * Enables automatic view advancement (carousel/autoplay functionality).
 * Respects user interaction and can be paused/resumed programmatically.
 */

import { useEffect, useCallback, useRef } from "react";
import { useScrollStore } from "../store";
import type { AutoScrollConfig } from "../types";

const DEFAULT_CONFIG: Required<AutoScrollConfig> = {
  enabled: false,
  interval: 5000,
  pauseOnInteraction: true,
  resumeDelay: 3000,
  direction: "forward",
  stopAtEnd: false,
};

export interface AutoScrollState {
  /** Whether auto-scroll is currently active (not paused) */
  isPlaying: boolean;
  /** Whether auto-scroll is paused due to user interaction */
  isPaused: boolean;
  /** Manually pause auto-scroll */
  pause: () => void;
  /** Manually resume auto-scroll */
  resume: () => void;
  /** Toggle play/pause state */
  toggle: () => void;
  /** Reset the interval timer */
  reset: () => void;
}

/**
 * Hook to enable automatic view advancement.
 * 
 * @example
 * ```tsx
 * const { isPlaying, pause, resume } = useAutoScroll({
 *   enabled: true,
 *   interval: 4000,
 *   pauseOnInteraction: true,
 * });
 * 
 * return (
 *   <button onClick={isPlaying ? pause : resume}>
 *     {isPlaying ? 'Pause' : 'Play'}
 *   </button>
 * );
 * ```
 */
export function useAutoScroll(config: AutoScrollConfig): AutoScrollState {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { 
    enabled, 
    interval, 
    pauseOnInteraction, 
    resumeDelay, 
    direction, 
    stopAtEnd 
  } = mergedConfig;
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const isAutoScrolling = useScrollStore((s) => s.isAutoScrolling);
  const isAutoScrollPaused = useScrollStore((s) => s.isAutoScrollPaused);
  const isTransitioning = useScrollStore((s) => s.isTransitioning);
  const activeIndex = useScrollStore((s) => s.activeIndex);
  const totalViews = useScrollStore((s) => s.totalViews);
  const infiniteScrollEnabled = useScrollStore((s) => s.infiniteScrollEnabled);
  const isDragging = useScrollStore((s) => s.isDragging);
  
  const setAutoScrolling = useScrollStore((s) => s.setAutoScrolling);
  const setAutoScrollPaused = useScrollStore((s) => s.setAutoScrollPaused);
  const goToNext = useScrollStore((s) => s.goToNext);
  const goToPrevious = useScrollStore((s) => s.goToPrevious);
  
  // Pause auto-scroll
  const pause = useCallback(() => {
    setAutoScrollPaused(true);
    
    // Clear any pending resume
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, [setAutoScrollPaused]);
  
  // Resume auto-scroll
  const resume = useCallback(() => {
    setAutoScrollPaused(false);
  }, [setAutoScrollPaused]);
  
  // Toggle state
  const toggle = useCallback(() => {
    if (isAutoScrollPaused) {
      resume();
    } else {
      pause();
    }
  }, [isAutoScrollPaused, pause, resume]);
  
  // Reset interval timer
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  // Handle user interaction detection
  useEffect(() => {
    if (!enabled || !pauseOnInteraction) return;
    
    if (isDragging || isTransitioning) {
      pause();
      
      // Schedule resume after interaction ends
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
      
      resumeTimeoutRef.current = setTimeout(() => {
        if (enabled) {
          resume();
        }
      }, resumeDelay);
    }
    
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, [isDragging, isTransitioning, enabled, pauseOnInteraction, resumeDelay, pause, resume]);
  
  // Initialize auto-scroll state
  useEffect(() => {
    setAutoScrolling(enabled);
    setAutoScrollPaused(false);
    
    return () => {
      setAutoScrolling(false);
    };
  }, [enabled, setAutoScrolling, setAutoScrollPaused]);
  
  // Main auto-scroll interval
  useEffect(() => {
    if (!enabled || isAutoScrollPaused || isTransitioning) {
      reset();
      return;
    }
    
    // Check if we should stop at end
    if (stopAtEnd && !infiniteScrollEnabled) {
      if (direction === "forward" && activeIndex >= totalViews - 1) {
        return;
      }
      if (direction === "backward" && activeIndex <= 0) {
        return;
      }
    }
    
    intervalRef.current = setInterval(() => {
      if (direction === "forward") {
        goToNext();
      } else {
        goToPrevious();
      }
    }, interval);
    
    return () => {
      reset();
    };
  }, [
    enabled, 
    isAutoScrollPaused, 
    isTransitioning, 
    interval, 
    direction, 
    stopAtEnd,
    activeIndex,
    totalViews,
    infiniteScrollEnabled,
    goToNext, 
    goToPrevious, 
    reset
  ]);
  
  return {
    isPlaying: isAutoScrolling && !isAutoScrollPaused,
    isPaused: isAutoScrollPaused,
    pause,
    resume,
    toggle,
    reset,
  };
}
