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
    },
    onActivate,
    onDeactivate,
    onEnterStart,
    onEnterEnd,
    onExitStart,
    onExitEnd,
  });

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

  const scrollClasses =
    scrollDirection === "vertical"
      ? "overflow-y-auto overflow-x-hidden"
      : "overflow-x-auto overflow-y-hidden";

  return (
    <section
      id={id}
      className={`relative w-full h-screen ${className}`}
      data-view-type="scroll-locked"
      data-active={isActive ? "true" : "false"}
    >
      <div
        ref={scrollRef}
        className={`w-full h-full ${scrollClasses} no-scrollbar`}
        style={{ scrollbarWidth: "none" }}
        data-scrollable="true"
      >
        {children}
      </div>
    </section>
  );
}

