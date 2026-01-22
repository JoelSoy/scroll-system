/**
 * PABRIX Scroll System - Controlled View
 * =======================================
 * Vista controlada programáticamente.
 * La navegación se controla mediante acciones explícitas al Store.
 */

import React, { useMemo, useEffect } from "react";
import { useViewRegistration } from "../hooks/useViewRegistration";
import { useScrollStore } from "../store";
import { useMetricsReporter } from "../hooks/useMetricsReporter";
import type { ControlledViewProps, ControlledViewConfig } from "../types";

export function ControlledView({
  id,
  children,
  className = "",
  scrollDirection = "none",
  allowInternalScroll = false,
  canProceed = false,
  allowGoBack = true,
  onActivate,
  onDeactivate,
  onEnterStart,
  onEnterEnd,
  onExitStart,
  onExitEnd,
}: ControlledViewProps) {
  const setExplicitLock = useScrollStore((s) => s.setViewExplicitLock);

  // Configuración de la vista
  const config = useMemo<ControlledViewConfig>(
    () => ({
      id,
      type: "controlled",
      scrollDirection,
      allowInternalScroll,
      allowGoBack,
    }),
    [id, scrollDirection, allowInternalScroll, allowGoBack]
  );

  // Registro en el sistema
  const { isActive, index } = useViewRegistration({
    config,
    onActivate,
    onDeactivate,
    onEnterStart,
    onEnterEnd,
    onExitStart,
    onExitEnd,
  });

  // Reporter para métricas (importante para Global Progress)
  // Si no tiene scroll interno, scrollDirection es "none" y el hook maneja eso.
  const { scrollRef } = useMetricsReporter({
    id,
    isActive,
    scrollDirection: allowInternalScroll ? (scrollDirection as any) : "none",
  });

  // Sincronizar canProceed con explicitLock
  useEffect(() => {
    const lockState = canProceed ? "unlocked" : "locked";
    setExplicitLock(id, lockState);
  }, [id, canProceed, setExplicitLock]);

  // Clases de overflow
  const overflowClasses = useMemo(() => {
    if (!allowInternalScroll) return "overflow-hidden";

    switch (scrollDirection) {
      case "vertical":
        return "overflow-y-auto overflow-x-hidden";
      case "horizontal":
        return "overflow-x-auto overflow-y-hidden";
      default:
        return "overflow-auto";
    }
  }, [allowInternalScroll, scrollDirection]);

  return (
    <section
      id={id}
      className={`relative w-full h-screen ${isActive ? "z-10" : "z-0"} ${className}`}
      data-view-type="controlled"
      data-active={isActive}
    >
      <div
        ref={scrollRef}
        className={`w-full h-full ${overflowClasses}`}
      >
        {children}
      </div>
    </section>
  );
}

// ============================================
// Hook auxiliar para control desde el contenido
// ============================================

export function useViewControl(viewId: string) {
  const setExplicitLock = useScrollStore((s) => s.setViewExplicitLock);
  const goToNext = useScrollStore((s) => s.goToNext);
  const goToPrevious = useScrollStore((s) => s.goToPrevious);
  const goToView = useScrollStore((s) => s.goToView);

  return useMemo(
    () => ({
      unlock: () => setExplicitLock(viewId, "unlocked"),
      lock: () => setExplicitLock(viewId, "locked"),
      
      // Navegación Programática (Forzada)
      goNext: () => goToNext(),
      goPrev: () => goToPrevious(),
      goTo: (to: number | string) => goToView(to),
    }),
    [viewId, setExplicitLock, goToNext, goToPrevious, goToView]
  );
}
