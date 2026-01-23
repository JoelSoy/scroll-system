/**
 * useGlobalProgress Hook
 * ========================================
 * Reports global scroll progress across all views.
 * Progress is calculated as: (activeIndex + viewProgress) / totalViews
 */

import { useEffect } from "react";
import { useScrollStore, selectGlobalProgress } from "../store";

export interface UseGlobalProgressOptions {
  /** Callback when progress changes */
  onProgress?: (progress: number) => void;
  /** Throttle updates in ms (default: 16 for 60fps) */
  throttle?: number;
}

export interface GlobalProgressState {
  /** Current global progress 0-1 */
  progress: number;
  /** Current active view index */
  activeIndex: number;
  /** Total number of views */
  totalViews: number;
  /** Progress percentage (0-100) */
  percentage: number;
}

/**
 * Hook to track global scroll progress across all views.
 * 
 * @example
 * ```tsx
 * const { progress, percentage } = useGlobalProgress({
 *   onProgress: (p) => console.log(`Progress: ${p * 100}%`)
 * });
 * 
 * return <ProgressBar value={percentage} />;
 * ```
 */
export function useGlobalProgress(
  options: UseGlobalProgressOptions = {}
): GlobalProgressState {
  const { onProgress, throttle = 16 } = options;
  
  const progress = useScrollStore(selectGlobalProgress);
  const activeIndex = useScrollStore((s) => s.activeIndex);
  const totalViews = useScrollStore((s) => s.totalViews);
  
  // Call onProgress callback when progress changes
  useEffect(() => {
    if (!onProgress) return;
    
    let lastCall = 0;
    const now = Date.now();
    
    if (now - lastCall >= throttle) {
      lastCall = now;
      onProgress(progress);
    }
  }, [progress, onProgress, throttle]);
  
  return {
    progress,
    activeIndex,
    totalViews,
    percentage: Math.round(progress * 100),
  };
}
