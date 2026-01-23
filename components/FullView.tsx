/**
 * Scroll System - Full View
 * =================================
 * Vista de pantalla completa sin scroll interno.
 * Cualquier scroll pasa directamente a la siguiente vista.
 */

import React, { useMemo } from "react";
import { useViewRegistration } from "../hooks/useViewRegistration";
import type { FullViewProps, FullViewConfig } from "../types";

/**
 * Vista que ocupa el 100% del viewport sin scroll interno.
 * Ideal para hero sections, splash screens, o secciones de impacto visual.
 *
 * @example
 * ```tsx
 * <FullView id="hero">
 *   <h1>Welcome to PABRIX</h1>
 * </FullView>
 * ```
 */
export function FullView({
  id,
  children,
  className = "",
  meta,
  onActivate,
  onDeactivate,
  onEnterStart,
  onEnterEnd,
  onExitStart,
  onExitEnd,
}: FullViewProps) {
  // Configuración de la vista
  const config = useMemo<FullViewConfig>(
    () => ({
      id,
      type: "full",
      meta,
    }),
    [id, meta]
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

  return (
    <section
      id={id}
      className={`full-view ${isActive ? "is-active" : ""} ${className}`}
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
      data-view-type="full"
      data-view-index={index}
      data-view-active={isActive}
      aria-hidden={!isActive}
    >
      {children}
    </section>
  );
}

