/**
 * Scroll System - Analytics Hook
 * ================================
 * Tracks view engagement metrics for analytics.
 */

import { useEffect, useRef, useCallback } from "react";
import { useScrollStore } from "../store";

export interface ViewAnalytics {
  viewId: string;
  viewIndex: number;
  enterTime: number;
  exitTime: number | null;
  duration: number; // in seconds
  isActive: boolean;
}

export interface UseScrollAnalyticsOptions {
  /** Callback when user enters a view */
  onViewEnter?: (analytics: ViewAnalytics) => void;
  /** Callback when user exits a view */
  onViewExit?: (analytics: ViewAnalytics) => void;
  /** Enable/disable tracking (default: true) */
  enabled?: boolean;
}

/**
 * Hook for tracking view engagement analytics.
 * 
 * @example
 * ```tsx
 * useScrollAnalytics({
 *   onViewEnter: (data) => analytics.track("view_enter", data),
 *   onViewExit: (data) => analytics.track("view_exit", { ...data, duration: data.duration }),
 * });
 * ```
 */
export function useScrollAnalytics(options: UseScrollAnalyticsOptions = {}) {
  const { onViewEnter, onViewExit, enabled = true } = options;
  
  const activeIndex = useScrollStore((s) => s.activeIndex);
  const activeId = useScrollStore((s) => s.activeId);
  const isTransitioning = useScrollStore((s) => s.isTransitioning);
  
  const enterTimeRef = useRef<number>(Date.now());
  const prevIndexRef = useRef<number>(activeIndex);
  const prevIdRef = useRef<string | null>(activeId);

  // Create analytics object
  const createAnalytics = useCallback((
    viewId: string, 
    viewIndex: number, 
    enterTime: number,
    isActive: boolean,
    exitTime: number | null = null
  ): ViewAnalytics => ({
    viewId,
    viewIndex,
    enterTime,
    exitTime,
    duration: exitTime ? (exitTime - enterTime) / 1000 : 0,
    isActive,
  }), []);

  useEffect(() => {
    if (!enabled) return;

    // View changed and transition ended
    if (!isTransitioning && (activeIndex !== prevIndexRef.current || activeId !== prevIdRef.current)) {
      const now = Date.now();
      
      // Exit previous view
      if (prevIdRef.current) {
        const exitAnalytics = createAnalytics(
          prevIdRef.current,
          prevIndexRef.current,
          enterTimeRef.current,
          false,
          now
        );
        onViewExit?.(exitAnalytics);
      }
      
      // Enter new view
      if (activeId) {
        enterTimeRef.current = now;
        const enterAnalytics = createAnalytics(
          activeId,
          activeIndex,
          now,
          true
        );
        onViewEnter?.(enterAnalytics);
      }
      
      prevIndexRef.current = activeIndex;
      prevIdRef.current = activeId;
    }
  }, [activeIndex, activeId, isTransitioning, enabled, onViewEnter, onViewExit, createAnalytics]);

  // Return current view analytics
  return {
    currentViewId: activeId,
    currentViewIndex: activeIndex,
    viewStartTime: enterTimeRef.current,
    getTimeInView: () => (Date.now() - enterTimeRef.current) / 1000,
  };
}

export default useScrollAnalytics;
