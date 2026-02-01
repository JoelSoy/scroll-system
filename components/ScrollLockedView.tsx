/**
 * Scroll System - Scroll Locked View
 * ==========================================
 * Vista con scroll interno.
 * Responsabilidad ÚNICA: Medir y reportar métricas al Store (vía hook).
 * NO decide si bloquear o no.
 */

import React, { useEffect, useRef } from "react";
import { useViewRegistration } from "../hooks/useViewRegistration";
import { useMetricsReporter } from "../hooks/useMetricsReporter";
import { useScrollStore } from "../store";
import type { ScrollLockedViewProps, ScrollResetBehavior } from "../types";

export function ScrollLockedView({
  id,
  children,
  className = "",
  scrollDirection = "vertical",
  scrollEndThreshold = 0.99,
  scrollResetBehavior = "direction-aware",
  forceScrollLock = false,
  enableTouchPassthrough = false,
  onScrollProgress,
  onActivate,
  onDeactivate,
  onEnterStart,
  onEnterEnd,
  onExitStart,
  onExitEnd,
}: ScrollLockedViewProps) {
  // Registro en el sistema
  const { isActive, index } = useViewRegistration({
    config: {
      id,
      type: "scroll-locked",
      scrollDirection,
      scrollEndThreshold,
      scrollResetBehavior,
      forceScrollLock,
      enableTouchPassthrough,
    },
    onActivate,
    onDeactivate,
    onEnterStart,
    onEnterEnd,
    onExitStart,
    onExitEnd,
  });

  // ========== TOUCH PASSTHROUGH LOGIC ==========
  const touchStartRef = useRef<{ y: number; scrollTop: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableTouchPassthrough || scrollDirection !== "vertical") return;
    const scrollEl = e.currentTarget;
    touchStartRef.current = {
      y: e.touches[0].clientY,
      scrollTop: scrollEl.scrollTop,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!enableTouchPassthrough || !touchStartRef.current || scrollDirection !== "vertical") return;

    const deltaY = touchStartRef.current.y - e.changedTouches[0].clientY;
    const scrollEl = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    const maxScroll = scrollHeight - clientHeight;
    
    // Threshold for swipe intention (e.g. 50px)
    const SWIPE_THRESHOLD = 50;

    if (Math.abs(deltaY) < SWIPE_THRESHOLD) return;

    // 1. Bottom Overscroll -> Swipe Up (deltaY > 0) -> Next View
    if (deltaY > 0) {
      // Check if we started at or near bottom AND ended at or near bottom
      // (Handling iOS bounce where values can be > maxScroll)
      const startedAtBottom = touchStartRef.current.scrollTop >= maxScroll - 1;
      const isAtBottom = scrollTop >= maxScroll - 1;

      if (startedAtBottom && isAtBottom) {
        useScrollStore.getState().processIntention({
          type: "navigate",
          direction: "down",
          strength: 1,
          origin: "touch",
        });
      }
    }

    // 2. Top Overscroll -> Swipe Down (deltaY < 0) -> Prev View
    if (deltaY < 0) {
      const startedAtTop = touchStartRef.current.scrollTop <= 1;
      const isAtTop = scrollTop <= 1;

      if (startedAtTop && isAtTop) {
        useScrollStore.getState().processIntention({
          type: "navigate",
          direction: "up",
          strength: 1,
          origin: "touch",
        });
      }
    }

    touchStartRef.current = null;
  };
  // =============================================

  // Metrics Reporter (Encapsula ResizeObserver y Scroll Listener)
  const { scrollRef } = useMetricsReporter({
    id,
    isActive,
    scrollDirection,
    onScrollProgress,
  });

  // Track previous active state to detect activation
  const wasActive = useRef(isActive);
  const lastNavigationDirection = useScrollStore((s) => s.lastNavigationDirection);

  // Reset scroll position when view becomes active
  useEffect(() => {
    // Only reset when transitioning from inactive to active
    if (isActive && !wasActive.current && scrollRef.current) {
      const element = scrollRef.current;
      
      // Determine target scroll position based on behavior
      let targetPosition: number;
      
      switch (scrollResetBehavior) {
        case "always-start":
          targetPosition = 0;
          break;
        case "always-end":
          targetPosition = element.scrollHeight - element.clientHeight;
          break;
        case "preserve":
          // Don't reset, keep current position
          targetPosition = -1; // Signal to skip
          break;
        case "direction-aware":
        default:
          // Coming from above (down) -> start at top
          // Coming from below (up) -> start at bottom
          if (lastNavigationDirection === "down") {
            targetPosition = 0;
          } else if (lastNavigationDirection === "up") {
            targetPosition = element.scrollHeight - element.clientHeight;
          } else {
            // Default to top if no direction (first load)
            targetPosition = 0;
          }
          break;
      }
      
      if (targetPosition >= 0) {
        if (scrollDirection === "vertical") {
          element.scrollTop = targetPosition;
        } else {
          element.scrollLeft = targetPosition;
        }
      }
    }
    
    wasActive.current = isActive;
  }, [isActive, lastNavigationDirection, scrollResetBehavior, scrollDirection]);

  const scrollStyles: React.CSSProperties =
    scrollDirection === "vertical"
      ? { overflowY: "auto", overflowX: "hidden" }
      : { overflowX: "auto", overflowY: "hidden" };

  return (
    <section
      id={id}
      className={`scroll-locked-view ${className}`}
      data-view-type="scroll-locked"
      data-active={isActive ? "true" : "false"}
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        ref={scrollRef}
        className="no-scrollbar"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          scrollbarWidth: "none",
          touchAction: scrollDirection === "vertical" ? "pan-y" : "pan-x",
          ...scrollStyles,
        }}
        data-scrollable="true"
      >
        {children}
      </div>
    </section>
  );
}

