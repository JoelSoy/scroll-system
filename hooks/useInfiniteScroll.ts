/**
 * useInfiniteScroll Hook
 * ========================================
 * Enables infinite/loop scroll behavior.
 * Wraps navigation from last view to first and vice versa.
 */

import { useEffect } from "react";
import { useScrollStore } from "../store";
import type { InfiniteScrollConfig } from "../types";

const DEFAULT_CONFIG: Required<InfiniteScrollConfig> = {
  enabled: false,
  loopDirection: "both",
};

export interface InfiniteScrollState {
  /** Whether infinite scroll is enabled */
  isEnabled: boolean;
  /** Enable infinite scroll */
  enable: () => void;
  /** Disable infinite scroll */
  disable: () => void;
  /** Toggle infinite scroll */
  toggle: () => void;
  /** Check if can loop forward (at last view) */
  canLoopForward: boolean;
  /** Check if can loop backward (at first view) */
  canLoopBackward: boolean;
}

/**
 * Hook to control infinite scroll behavior.
 * 
 * @example
 * ```tsx
 * // Simple usage - enable infinite scroll
 * useInfiniteScroll({ enabled: true });
 * 
 * // With controls
 * const { isEnabled, toggle } = useInfiniteScroll({ enabled: true });
 * 
 * return (
 *   <button onClick={toggle}>
 *     Loop: {isEnabled ? 'ON' : 'OFF'}
 *   </button>
 * );
 * ```
 */
export function useInfiniteScroll(
  config: boolean | InfiniteScrollConfig = false
): InfiniteScrollState {
  // Normalize config
  const normalizedConfig: Required<InfiniteScrollConfig> = typeof config === "boolean"
    ? { ...DEFAULT_CONFIG, enabled: config }
    : { ...DEFAULT_CONFIG, ...config };
  
  const { enabled, loopDirection } = normalizedConfig;
  
  const infiniteScrollEnabled = useScrollStore((s) => s.infiniteScrollEnabled);
  const setInfiniteScrollEnabled = useScrollStore((s) => s.setInfiniteScrollEnabled);
  const activeIndex = useScrollStore((s) => s.activeIndex);
  const totalViews = useScrollStore((s) => s.totalViews);
  
  // Sync config with store
  useEffect(() => {
    setInfiniteScrollEnabled(enabled);
    
    return () => {
      // Optionally disable on unmount
      // setInfiniteScrollEnabled(false);
    };
  }, [enabled, setInfiniteScrollEnabled]);
  
  const enable = () => setInfiniteScrollEnabled(true);
  const disable = () => setInfiniteScrollEnabled(false);
  const toggle = () => setInfiniteScrollEnabled(!infiniteScrollEnabled);
  
  // Check loop capabilities based on direction config
  const canLoopForward = infiniteScrollEnabled && 
    (loopDirection === "forward" || loopDirection === "both") &&
    activeIndex === totalViews - 1;
    
  const canLoopBackward = infiniteScrollEnabled && 
    (loopDirection === "backward" || loopDirection === "both") &&
    activeIndex === 0;
  
  return {
    isEnabled: infiniteScrollEnabled,
    enable,
    disable,
    toggle,
    canLoopForward,
    canLoopBackward,
  };
}
