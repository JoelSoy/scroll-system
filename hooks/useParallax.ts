/**
 * useParallax Hook
 * ========================================
 * Enables parallax effects for elements within views.
 * Calculates transform values based on scroll progress.
 */

import { useMemo } from "react";
import { useScrollStore } from "../store";
import type { ParallaxConfig, ParallaxState } from "../types";

const DEFAULT_CONFIG: Required<ParallaxConfig> = {
  speed: 0.5,
  direction: "vertical",
  offset: 0,
  easing: "linear",
};

// Easing functions
const easingFunctions = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 2),
  easeInOut: (t: number) => t < 0.5 
    ? 2 * t * t 
    : 1 - Math.pow(-2 * t + 2, 2) / 2,
};

/**
 * Hook to create parallax effects within views.
 * 
 * @param viewId - The ID of the view this parallax belongs to
 * @param config - Parallax configuration
 * 
 * @example
 * ```tsx
 * function HeroSection() {
 *   const { style } = useParallax("hero", { speed: 0.3 });
 *   
 *   return (
 *     <div style={style}>
 *       <img src="/background.jpg" alt="Background" />
 *     </div>
 *   );
 * }
 * ```
 */
export function useParallax(
  viewId: string,
  config: ParallaxConfig = {}
): ParallaxState {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { speed, direction, offset, easing } = mergedConfig;
  
  const views = useScrollStore((s) => s.views);
  const activeIndex = useScrollStore((s) => s.activeIndex);
  const globalProgress = useScrollStore((s) => s.globalProgress);
  
  const result = useMemo(() => {
    const view = views.find((v) => v.id === viewId);
    if (!view) {
      return {
        transform: 0,
        style: {} as React.CSSProperties,
        progress: 0,
      };
    }
    
    // Calculate view-relative progress
    // -1 when view is one before active, 0 when active, 1 when one after
    const viewOffset = view.index - activeIndex;
    
    // Combine with internal scroll progress for smooth effect
    const internalProgress = view.isActive ? view.progress : 0;
    const combinedProgress = viewOffset + internalProgress;
    
    // Apply easing
    const easingFn = easingFunctions[easing];
    const easedProgress = easingFn(Math.abs(combinedProgress)) * Math.sign(combinedProgress);
    
    // Calculate transform value
    // Speed controls how much the element moves relative to scroll
    // 0.5 = half speed (classic parallax), 1 = same speed, 2 = double speed
    const maxDistance = 100; // percentage of viewport
    const transformValue = (easedProgress * maxDistance * speed) + offset;
    
    // Generate CSS transform
    const transformProperty = direction === "vertical" 
      ? `translateY(${transformValue}px)` 
      : `translateX(${transformValue}px)`;
    
    const style: React.CSSProperties = {
      transform: transformProperty,
      willChange: "transform",
    };
    
    return {
      transform: transformValue,
      style,
      progress: combinedProgress,
    };
  }, [viewId, views, activeIndex, speed, direction, offset, easing]);
  
  return result;
}

/**
 * Simplified hook for parallax on active view only.
 * Uses global progress instead of view-specific calculations.
 */
export function useActiveParallax(config: ParallaxConfig = {}): ParallaxState {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { speed, direction, offset, easing } = mergedConfig;
  
  const globalProgress = useScrollStore((s) => s.globalProgress);
  const activeIndex = useScrollStore((s) => s.activeIndex);
  const views = useScrollStore((s) => s.views);
  
  return useMemo(() => {
    const activeView = views[activeIndex];
    const viewProgress = activeView?.progress ?? 0;
    
    const easingFn = easingFunctions[easing];
    const easedProgress = easingFn(viewProgress);
    
    const maxDistance = 100;
    const transformValue = (easedProgress * maxDistance * speed) + offset;
    
    const transformProperty = direction === "vertical" 
      ? `translateY(${transformValue}px)` 
      : `translateX(${transformValue}px)`;
    
    const style: React.CSSProperties = {
      transform: transformProperty,
      willChange: "transform",
    };
    
    return {
      transform: transformValue,
      style,
      progress: viewProgress,
    };
  }, [globalProgress, activeIndex, views, speed, direction, offset, easing]);
}
