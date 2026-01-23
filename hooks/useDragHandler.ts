/**
 * Scroll System - Drag Handler (Touch Physics)
 * ==============================================
 * Implements 1:1 direct manipulation for touch devices.
 * 
 * Features:
 * - Real-time tracking of finger position
 * - Outputs dragOffset for visual feedback
 * - Spring-based release detection (snap vs. proceed)
 * 
 * This hook works alongside useTouchHandler which handles discrete swipes.
 */

import { useRef, useEffect, useCallback, useState } from "react";
import { useScrollStore } from "../store";

// Configuration
const DRAG_THRESHOLD = 50; // Minimum drag to trigger navigation
const VELOCITY_THRESHOLD = 0.5; // Minimum velocity (px/ms) for quick swipe
const RESISTANCE_FACTOR = 0.4; // Resistance when dragging past bounds

export interface DragState {
  isDragging: boolean;
  dragOffset: number; // -1 to 1 relative to viewport, or 0 when not dragging
  dragDirection: "up" | "down" | null;
}

export interface UseDragHandlerOptions {
  /** Enable/disable drag handling (default: true) */
  enabled?: boolean;
  /** Callback when drag state changes */
  onDragUpdate?: (state: DragState) => void;
  /** Callback when drag completes with navigation decision */
  onDragEnd?: (shouldNavigate: boolean, direction: "up" | "down") => void;
}

export function useDragHandler(options: UseDragHandlerOptions = {}) {
  const { enabled = true, onDragUpdate, onDragEnd } = options;
  
  // State
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragOffset: 0,
    dragDirection: null,
  });

  // Refs for tracking
  const touchStartRef = useRef<{ y: number; time: number } | null>(null);
  const lastMoveRef = useRef<{ y: number; time: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  // Update drag state helper
  const updateDragState = useCallback((newState: Partial<DragState>) => {
    setDragState(prev => {
      const updated = { ...prev, ...newState };
      onDragUpdate?.(updated);
      return updated;
    });
  }, [onDragUpdate]);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Don't interfere with scrollable elements
      const target = e.target as HTMLElement;
      if (target.closest('[data-scrollable="true"]')) return;

      touchStartRef.current = {
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      lastMoveRef.current = touchStartRef.current;
      
      // Set global dragging flag to prevent wheel conflicts
      useScrollStore.getState().setDragging(true);
      updateDragState({ isDragging: true, dragOffset: 0, dragDirection: null });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const currentY = e.touches[0].clientY;
      const deltaY = touchStartRef.current.y - currentY;
      const viewportHeight = window.innerHeight;
      
      // Calculate offset as percentage of viewport (-1 to 1)
      let offset = deltaY / viewportHeight;
      
      // Apply resistance at bounds
      const store = useScrollStore.getState();
      const atStart = store.activeIndex === 0 && deltaY < 0;
      const atEnd = store.activeIndex === store.totalViews - 1 && deltaY > 0;
      
      if (atStart || atEnd) {
        offset = offset * RESISTANCE_FACTOR;
      }
      
      // Clamp offset
      offset = Math.max(-1, Math.min(1, offset));
      
      // Track for velocity calculation
      lastMoveRef.current = { y: currentY, time: Date.now() };
      
      // Update state (using rAF for performance)
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        updateDragState({
          dragOffset: offset,
          dragDirection: deltaY > 0 ? "down" : deltaY < 0 ? "up" : null,
        });
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || !lastMoveRef.current) {
        updateDragState({ isDragging: false, dragOffset: 0, dragDirection: null });
        return;
      }

      const endY = e.changedTouches[0].clientY;
      const deltaY = touchStartRef.current.y - endY;
      const timeDelta = Date.now() - lastMoveRef.current.time;
      const velocity = timeDelta > 0 ? Math.abs(deltaY) / timeDelta : 0;
      
      const store = useScrollStore.getState();
      const atStart = store.activeIndex === 0;
      const atEnd = store.activeIndex === store.totalViews - 1;
      const activeView = store.views[store.activeIndex];
      
      // Determine if we should navigate
      const exceedsThreshold = Math.abs(deltaY) > DRAG_THRESHOLD;
      const hasVelocity = velocity > VELOCITY_THRESHOLD;
      const direction = deltaY > 0 ? "down" : "up";
      
      // Check if active view has internal scroll
      let canNavigateInternal = true;
      if (activeView?.capability === "internal") {
        const scrollContainer = document.querySelector(
          `[data-view-type="scroll-locked"][data-active="true"] > div`
        ) as HTMLElement | null;
        
        if (scrollContainer) {
          const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
          const maxScroll = scrollHeight - clientHeight;
          const isAtBottom = scrollTop >= maxScroll - 1;
          const isAtTop = scrollTop <= 1;
          
          // Only allow navigation if at the appropriate boundary
          if (direction === "down" && !isAtBottom) {
            canNavigateInternal = false;
          }
          if (direction === "up" && !isAtTop) {
            canNavigateInternal = false;
          }
        }
      }
      
      // Check bounds
      const canNavigate = 
        canNavigateInternal &&
        ((direction === "down" && !atEnd) || 
        (direction === "up" && !atStart));
      
      const shouldNavigate = canNavigate && (exceedsThreshold || hasVelocity);
      
      // Notify callback
      onDragEnd?.(shouldNavigate, direction);
      
      // If navigating, processIntention will handle it
      if (shouldNavigate) {
        store.processIntention({
          type: "navigate",
          direction,
          strength: Math.min(1, velocity / VELOCITY_THRESHOLD),
          origin: "touch",
        });
      }
      
      // Reset state
      touchStartRef.current = null;
      lastMoveRef.current = null;
      useScrollStore.getState().setDragging(false);
      updateDragState({ isDragging: false, dragOffset: 0, dragDirection: null });
    };

    const handleTouchCancel = () => {
      touchStartRef.current = null;
      lastMoveRef.current = null;
      useScrollStore.getState().setDragging(false);
      updateDragState({ isDragging: false, dragOffset: 0, dragDirection: null });
    };

    // Use capture for touch events to get them before internal scroll
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, updateDragState, onDragEnd]);

  return dragState;
}

export default useDragHandler;
