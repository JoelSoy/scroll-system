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

  // Styles for overflow
  const overflowStyles = useMemo((): React.CSSProperties => {
    if (!allowInternalScroll) return { overflow: "hidden" };

    switch (scrollDirection) {
      case "vertical":
        return { overflowY: "auto", overflowX: "hidden" };
      case "horizontal":
        return { overflowX: "auto", overflowY: "hidden" };
      default:
        return { overflow: "auto" };
    }
  }, [allowInternalScroll, scrollDirection]);

  return (
    <section
      id={id}
      className={`controlled-view ${className}`}
      data-view-type="controlled"
      data-active={isActive}
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        zIndex: isActive ? 10 : 0,
      }}
    >
      <div
        ref={scrollRef}
        style={{
          width: "100%",
          height: "100%",
          ...overflowStyles,
        }}
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
