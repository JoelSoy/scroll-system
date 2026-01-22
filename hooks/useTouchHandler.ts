/**
 * Scroll System - Touch Handler
 * =====================================
 * Determina la INTENCIÓN del usuario basada en Gestos Táctiles (Swipe).
 * Traduce Touch Events -> Intention -> Store.processIntention()
 */

import { useRef, useEffect } from "react";
import { useScrollStore } from "../store";
import { NAV_THRESHOLDS } from "../constants";
import type { UserIntention } from "../types";

export interface UseTouchHandlerOptions {
  /** Enable/disable the touch handler (default: true) */
  enabled?: boolean;
}

export function useTouchHandler(options: UseTouchHandlerOptions = {}) {
  const { enabled = true } = options;
  
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchStartTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      touchStartTime.current = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      };

      const deltaY = touchStart.current.y - touchEnd.y;
      const deltaX = touchStart.current.x - touchEnd.x;
      const timeElapsed = Date.now() - touchStartTime.current;

      // 1. Detectar si es un Swipe Vertical válido
      // Debe ser mayormente vertical y rápido o largo
      if (
        Math.abs(deltaY) > Math.abs(deltaX) && // Vertical
        Math.abs(deltaY) > NAV_THRESHOLDS.TOUCH && // Threshold distancia
        timeElapsed < 800 // Tiempo máximo para considerar swipe rápido
      ) {
        const direction = deltaY > 0 ? "down" : "up";

        // 2. Construir Intención
        const intention: UserIntention = {
          type: "navigate",
          direction: direction,
          strength: 1, // Swipes son intenciones fuertes
          origin: "touch"
        };
        
        // 3. Enviar al Store
        useScrollStore.getState().processIntention(intention);
      }

      touchStart.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled]);
}

