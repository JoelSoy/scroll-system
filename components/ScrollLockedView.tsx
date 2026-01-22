/**
 * Scroll System - Scroll Locked View
 * ==========================================
 * Vista con scroll interno.
 * Responsabilidad ÚNICA: Medir y reportar métricas al Store (vía hook).
 * NO decide si bloquear o no.
 */

import React from "react";
import { useViewRegistration } from "../hooks/useViewRegistration";
import { useMetricsReporter } from "../hooks/useMetricsReporter";
import type { ScrollLockedViewProps } from "../types";

export function ScrollLockedView({
  id,
  children,
  className = "",
  scrollDirection = "vertical",
  scrollEndThreshold = 0.99,
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
      scrollEndThreshold
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

  const scrollClasses =
    scrollDirection === "vertical"
      ? "overflow-y-auto overflow-x-hidden"
      : "overflow-x-auto overflow-y-hidden";

  return (
    <section
      id={id}
      className={`relative w-full h-screen ${className}`}
      data-view-type="scroll-locked"
      data-active={isActive}
    >
      <div
        ref={scrollRef}
        className={`w-full h-full ${scrollClasses} no-scrollbar`}
        style={{ scrollbarWidth: "none" }}
      >
        {children}
      </div>
    </section>
  );
}

