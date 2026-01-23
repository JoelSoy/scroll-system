/**
 * useSnapPoints Hook
 * ========================================
 * Manages snap points within views for sub-view navigation.
 * Enables multiple "stops" within a single scrollable view.
 */

import { useEffect, useCallback, useRef, useMemo } from "react";
import { useScrollStore } from "../store";
import type { SnapPoint, SnapPointState } from "../types";

export interface UseSnapPointsOptions {
  /** The view ID this snap points system belongs to */
  viewId: string;
  /** Array of snap points */
  points: SnapPoint[];
  /** Threshold for snapping (0-1, default: 0.1) */
  snapThreshold?: number;
  /** Enable smooth scrolling to snap points */
  smoothScroll?: boolean;
}

export interface SnapPointsState {
  /** Current active snap point */
  activePoint: SnapPoint | null;
  /** Index of the active snap point */
  activeIndex: number;
  /** Navigate to a specific snap point */
  goToPoint: (pointId: string) => void;
  /** Navigate to next snap point */
  goToNextPoint: () => void;
  /** Navigate to previous snap point */
  goToPrevPoint: () => void;
  /** All snap points with active state */
  points: (SnapPoint & { isActive: boolean })[];
  /** Current progress within snap points (0-1) */
  progress: number;
}

/**
 * Hook to manage snap points within a view.
 * 
 * @example
 * ```tsx
 * const snapPoints = [
 *   { id: 'intro', position: 0, label: 'Introduction' },
 *   { id: 'features', position: 0.33, label: 'Features' },
 *   { id: 'pricing', position: 0.66, label: 'Pricing' },
 *   { id: 'cta', position: 1, label: 'Get Started' },
 * ];
 * 
 * function LongView() {
 *   const { activePoint, goToNextPoint } = useSnapPoints({
 *     viewId: 'landing',
 *     points: snapPoints,
 *   });
 *   
 *   return (
 *     <div>
 *       <nav>
 *         {snapPoints.map(p => (
 *           <button key={p.id} className={activePoint?.id === p.id ? 'active' : ''}>
 *             {p.label}
 *           </button>
 *         ))}
 *       </nav>
 *       <button onClick={goToNextPoint}>Next Section</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSnapPoints(options: UseSnapPointsOptions): SnapPointsState {
  const { viewId, points, snapThreshold = 0.1, smoothScroll = true } = options;
  
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const lastActivePointRef = useRef<string | null>(null);
  
  const views = useScrollStore((s) => s.views);
  const setActiveSnapPoint = useScrollStore((s) => s.setActiveSnapPoint);
  
  const view = useMemo(() => views.find((v) => v.id === viewId), [views, viewId]);
  const viewProgress = view?.progress ?? 0;
  const activeSnapPointId = view?.activeSnapPointId ?? null;
  
  // Sort points by position
  const sortedPoints = useMemo(() => 
    [...points].sort((a, b) => a.position - b.position),
    [points]
  );
  
  // Find active snap point based on current progress
  const activePointData = useMemo(() => {
    if (sortedPoints.length === 0) {
      return { point: null, index: -1 };
    }
    
    // Find the closest snap point
    let closestIndex = 0;
    let closestDistance = Math.abs(viewProgress - sortedPoints[0].position);
    
    for (let i = 1; i < sortedPoints.length; i++) {
      const distance = Math.abs(viewProgress - sortedPoints[i].position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }
    
    // Only snap if within threshold
    if (closestDistance <= snapThreshold) {
      return { point: sortedPoints[closestIndex], index: closestIndex };
    }
    
    // Otherwise, find which segment we're in
    for (let i = sortedPoints.length - 1; i >= 0; i--) {
      if (viewProgress >= sortedPoints[i].position - snapThreshold) {
        return { point: sortedPoints[i], index: i };
      }
    }
    
    return { point: sortedPoints[0], index: 0 };
  }, [viewProgress, sortedPoints, snapThreshold]);
  
  // Update store and fire callbacks when snap point changes
  useEffect(() => {
    const newPointId = activePointData.point?.id ?? null;
    
    if (newPointId !== lastActivePointRef.current) {
      // Fire onLeave callback for previous point
      if (lastActivePointRef.current) {
        const prevPoint = sortedPoints.find(p => p.id === lastActivePointRef.current);
        prevPoint?.onLeave?.();
      }
      
      // Update store
      setActiveSnapPoint(viewId, newPointId);
      
      // Fire onReach callback for new point
      if (newPointId) {
        const newPoint = sortedPoints.find(p => p.id === newPointId);
        newPoint?.onReach?.();
      }
      
      lastActivePointRef.current = newPointId;
    }
  }, [activePointData.point?.id, viewId, sortedPoints, setActiveSnapPoint]);
  
  // Navigate to a specific snap point
  const goToPoint = useCallback((pointId: string) => {
    const point = sortedPoints.find(p => p.id === pointId);
    if (!point || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;
    const targetScroll = point.position * maxScroll;
    
    container.scrollTo({
      top: targetScroll,
      behavior: smoothScroll ? "smooth" : "auto",
    });
  }, [sortedPoints, smoothScroll]);
  
  // Navigate to next snap point
  const goToNextPoint = useCallback(() => {
    const nextIndex = Math.min(activePointData.index + 1, sortedPoints.length - 1);
    const nextPoint = sortedPoints[nextIndex];
    if (nextPoint) {
      goToPoint(nextPoint.id);
    }
  }, [activePointData.index, sortedPoints, goToPoint]);
  
  // Navigate to previous snap point
  const goToPrevPoint = useCallback(() => {
    const prevIndex = Math.max(activePointData.index - 1, 0);
    const prevPoint = sortedPoints[prevIndex];
    if (prevPoint) {
      goToPoint(prevPoint.id);
    }
  }, [activePointData.index, sortedPoints, goToPoint]);
  
  // Points with active state
  const pointsWithState = useMemo(() => 
    sortedPoints.map(point => ({
      ...point,
      isActive: point.id === activePointData.point?.id,
    })),
    [sortedPoints, activePointData.point?.id]
  );
  
  return {
    activePoint: activePointData.point,
    activeIndex: activePointData.index,
    goToPoint,
    goToNextPoint,
    goToPrevPoint,
    points: pointsWithState,
    progress: viewProgress,
  };
}

/**
 * Utility to create snap points from an array of positions.
 */
export function createSnapPoints(
  positions: number[],
  options?: { prefix?: string; labels?: string[] }
): SnapPoint[] {
  const { prefix = "snap", labels } = options ?? {};
  
  return positions.map((position, index) => ({
    id: `${prefix}-${index}`,
    position,
    label: labels?.[index] ?? `Section ${index + 1}`,
  }));
}
