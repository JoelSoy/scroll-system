/**
 * usePreload Hook
 * ========================================
 * Manages view preloading for smoother transitions.
 * Pre-renders adjacent views based on configuration.
 */

import { useEffect, useMemo } from "react";
import { useScrollStore } from "../store";
import type { PreloadConfig } from "../types";

const DEFAULT_CONFIG: Required<PreloadConfig> = {
  ahead: 1,
  behind: 1,
  delay: 100,
};

export interface PreloadState {
  /** Whether a specific view should be preloaded */
  shouldPreload: (viewId: string) => boolean;
  /** List of view IDs that should be preloaded */
  preloadedViewIds: string[];
  /** Check if a view is currently preloaded */
  isPreloaded: (viewId: string) => boolean;
}

/**
 * Hook to manage view preloading.
 * 
 * @example
 * ```tsx
 * const { shouldPreload, preloadedViewIds } = usePreload({ ahead: 2, behind: 1 });
 * 
 * // In your view component:
 * if (!shouldPreload(viewId)) {
 *   return <Placeholder />;
 * }
 * return <ActualContent />;
 * ```
 */
export function usePreload(config: PreloadConfig = {}): PreloadState {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { ahead, behind, delay } = mergedConfig;
  
  const views = useScrollStore((s) => s.views);
  const activeIndex = useScrollStore((s) => s.activeIndex);
  const totalViews = useScrollStore((s) => s.totalViews);
  const infiniteScrollEnabled = useScrollStore((s) => s.infiniteScrollEnabled);
  const setViewPreloaded = useScrollStore((s) => s.setViewPreloaded);
  
  // Calculate which views should be preloaded
  const preloadedViewIds = useMemo(() => {
    const ids: string[] = [];
    
    for (let i = -behind; i <= ahead; i++) {
      let targetIndex = activeIndex + i;
      
      // Handle infinite scroll wrapping
      if (infiniteScrollEnabled) {
        if (targetIndex < 0) targetIndex = totalViews + targetIndex;
        if (targetIndex >= totalViews) targetIndex = targetIndex - totalViews;
      }
      
      if (targetIndex >= 0 && targetIndex < totalViews) {
        const view = views[targetIndex];
        if (view) {
          ids.push(view.id);
        }
      }
    }
    
    return ids;
  }, [activeIndex, ahead, behind, views, totalViews, infiniteScrollEnabled]);
  
  // Update preload status in store with delay
  useEffect(() => {
    const timer = setTimeout(() => {
      views.forEach((view) => {
        const shouldBePreloaded = preloadedViewIds.includes(view.id);
        if (view.isPreloaded !== shouldBePreloaded) {
          setViewPreloaded(view.id, shouldBePreloaded);
        }
      });
    }, delay);
    
    return () => clearTimeout(timer);
  }, [preloadedViewIds, views, setViewPreloaded, delay]);
  
  const shouldPreload = (viewId: string): boolean => {
    return preloadedViewIds.includes(viewId);
  };
  
  const isPreloaded = (viewId: string): boolean => {
    const view = views.find((v) => v.id === viewId);
    return view?.isPreloaded ?? false;
  };
  
  return {
    shouldPreload,
    preloadedViewIds,
    isPreloaded,
  };
}
