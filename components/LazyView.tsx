/**
 * Scroll System - Lazy View Wrapper
 * ===================================
 * Wrapper that only renders children when the view is within the
 * active range (current +/- buffer).
 */

import React, { useMemo } from "react";
import { useScrollStore } from "../store";

export interface LazyViewProps {
  /** The view ID to track */
  viewId: string;
  /** Number of views before/after active to render (default: 1) */
  buffer?: number;
  /** Content to render when lazy loading */
  children: React.ReactNode;
  /** Placeholder to show when not in range */
  placeholder?: React.ReactNode;
}

/**
 * Wraps view content to only render when within the active range.
 * Improves performance for apps with many views.
 * 
 * @example
 * ```tsx
 * <FullView id="section-3">
 *   <LazyView viewId="section-3">
 *     <HeavyComponent />
 *   </LazyView>
 * </FullView>
 * ```
 */
export function LazyView({
  viewId,
  buffer = 1,
  children,
  placeholder = null,
}: LazyViewProps) {
  const activeIndex = useScrollStore((s) => s.activeIndex);
  const views = useScrollStore((s) => s.views);
  
  const shouldRender = useMemo(() => {
    const viewIndex = views.findIndex((v) => v.id === viewId);
    if (viewIndex === -1) return false;
    
    const minIndex = Math.max(0, activeIndex - buffer);
    const maxIndex = Math.min(views.length - 1, activeIndex + buffer);
    
    return viewIndex >= minIndex && viewIndex <= maxIndex;
  }, [viewId, views, activeIndex, buffer]);

  if (!shouldRender) {
    return <>{placeholder}</>;
  }

  return <>{children}</>;
}

export default LazyView;
