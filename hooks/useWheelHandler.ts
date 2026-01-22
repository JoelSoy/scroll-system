/**
 * PABRIX Scroll System - Wheel Handler
 * =====================================
 * Determina la INTENCIÓN del usuario basada en eventos de Wheel.
 * Traduce deltaY -> Intention -> Store.processIntention()
 */

import { useEffect, useRef } from "react";
import { useScrollStore } from "../store";
import { normalizeWheel } from "../utils/normalizeWheel";
import { NAV_THRESHOLDS } from "../constants";
import type { UserIntention } from "../types";

export function useWheelHandler() {
  const scrollAccumulator = useRef(0);
  const lastScrollTime = useRef(0);
  const isTransitioning = useScrollStore((s) => s.isTransitioning);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const state = useScrollStore.getState();
      
      // 1. Ignorar si hay transición activa o drag en progreso
      if (state.isTransitioning || state.isDragging) {
        event.preventDefault();
        return;
      }

      // 2. Normalizar evento (cross-browser)
      const normalized = normalizeWheel(event);
      const delta = normalized.pixelY;

      // 3. Acumular delta para thresholds
      scrollAccumulator.current += delta;
      const now = Date.now();

      // Reset acumulador si pasó mucho tiempo (gesto interrumpido)
      if (now - lastScrollTime.current > 200) {
        scrollAccumulator.current = delta;
      }
      lastScrollTime.current = now;

      // 4. Verificar Threshold
      if (Math.abs(scrollAccumulator.current) >= NAV_THRESHOLDS.WHEEL) {
        const direction = scrollAccumulator.current > 0 ? "down" : "up";
        
        // 5. Construir Intención
        const intention: UserIntention = {
          type: "navigate",
          direction: direction,
          strength: Math.min(Math.abs(scrollAccumulator.current) / NAV_THRESHOLDS.WHEEL, 1),
          origin: "wheel"
        };

        // 6. Enviar al Store (Brain)
        // El store decide si bloquea, navega o ignora.
        const handled = useScrollStore.getState().processIntention(intention);

        if (handled) {
          // Si el store actuó (navegó), reseteamos y prevenimos scroll nativo visual
          // (aunque la transición ya oculta scrollbars)
          scrollAccumulator.current = 0;
          
          // Prevent Overscroll visual en Macs
          event.preventDefault(); 
        } else {
            // Si NO fue manejado (ej. estamos locked),
            // NO prevenimos default aquí para permitir scroll interno natural.
            // EXCEPTO si estamos en boundaries (overscroll prevention)
            
            // TODO: Podríamos añadir lógica de Overscroll Prevention aquí si se desea.
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);
}
