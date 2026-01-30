/**
 * Scroll System - Metrics Reporter Hook
 * =============================================
 * Hook reutilizable para medir y reportar métricas al Store.
 * Encapsula ResizeObserver y Scroll Listeners.
 * 
 * Performance: Throttled to ~15fps (66ms) for scroll events.
 */

import { useRef, useCallback, useEffect, useMemo } from "react";
import { useScrollStore } from "../store";
import { throttle } from "../utils";
import type { ViewMetrics, ScrollDirection } from "../types";

// Throttle interval in ms (~15fps for performance)
const SCROLL_THROTTLE_MS = 66;

interface UseMetricsReporterOptions {
  id: string;
  isActive: boolean;
  scrollDirection: ScrollDirection;
  onScrollProgress?: (progress: number) => void;
  /** Custom throttle interval (default: 66ms / ~15fps) */
  throttleMs?: number;
}

export function useMetricsReporter({
  id,
  isActive,
  scrollDirection,
  onScrollProgress,
  throttleMs = SCROLL_THROTTLE_MS,
}: UseMetricsReporterOptions) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const updateMetrics = useScrollStore((s) => s.updateViewMetrics);

  // Core measurement function (unthrottled)
  const measureAndReport = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    // 1. Medir DOM
    const metrics: ViewMetrics = {
      scrollHeight: scrollDirection === "vertical" ? el.scrollHeight : el.scrollWidth,
      clientHeight: scrollDirection === "vertical" ? el.clientHeight : el.clientWidth,
      scrollTop: scrollDirection === "vertical" ? el.scrollTop : el.scrollLeft,
    };

    // 2. Reportar al Store
    updateMetrics(id, metrics);

    // 3. Feedback local (calculado crudamente para UI instantánea si se requiere)
    if (onScrollProgress) {
      const max = metrics.scrollHeight - metrics.clientHeight;
      const progress = max > 0 ? metrics.scrollTop / max : 1;
      onScrollProgress(progress);
    }
  }, [id, scrollDirection, updateMetrics, onScrollProgress]);

  // Throttled version for scroll events (performance optimization)
  const throttledMeasure = useMemo(
    () => throttle(measureAndReport, throttleMs),
    [measureAndReport, throttleMs]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // ResizeObserver (uses rAF, not throttled - resize is infrequent)
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(measureAndReport);
    });
    
    resizeObserver.observe(el);
    Array.from(el.children).forEach(child => resizeObserver.observe(child));

    // Scroll Listener (throttled for performance)
    el.addEventListener("scroll", throttledMeasure, { passive: true });

    // Initial measure (immediate)
    measureAndReport();
    
    // Delayed measure to catch late renders (fonts loading, images, etc.)
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => measureAndReport());
    } else {
      setTimeout(() => measureAndReport(), 150);
    }

    return () => {
      resizeObserver.disconnect();
      el.removeEventListener("scroll", throttledMeasure);
    };
  }, [measureAndReport, throttledMeasure]);

  // Re-measure when view becomes active
  useEffect(() => {
    if (isActive) {
      measureAndReport();
    }
  }, [isActive, measureAndReport]);

  return { scrollRef, measureAndReport };
}
