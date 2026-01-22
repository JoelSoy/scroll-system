/**
 * Scroll System - Scroll Container
 * ========================================
 * Contenedor principal del sistema de scroll.
 * Maneja la disposición de vistas y eventos de navegación.
 */

import React, { useEffect, useRef, useMemo, useState } from "react";
import { useScrollStore } from "../store";
import { useWheelHandler } from "../hooks/useWheelHandler";
import { useTouchHandler } from "../hooks/useTouchHandler";
import { useKeyboardHandler } from "../hooks/useKeyboardHandler";
import { useHashSync } from "../hooks/useHashSync";
import { useDragHandler } from "../hooks/useDragHandler";
import { useFocusManagement } from "../hooks/useFocusManagement";
import { useScrollSystem } from "../hooks/useScrollSystem";
import { prefersReducedMotion } from "../utils";
import {
  DEFAULT_TRANSITION_DURATION,
  DEFAULT_TRANSITION_EASING,
} from "../constants";
import type { ScrollContainerProps } from "../types";

export function ScrollContainer({
  children,
  className = "",
  transitionDuration = DEFAULT_TRANSITION_DURATION,
  transitionEasing = DEFAULT_TRANSITION_EASING,
  onViewChange,
  onInitialized,
  // Deep Linking options
  enableHashSync = false,
  hashPushHistory = false,
  hashPrefix = "",
  // Accessibility
  respectReducedMotion = true,
  enableFocusManagement = true,
  // Touch Physics
  enableDragPhysics = false,
  // Layout
  orientation = "vertical",
}: ScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // SSR Guard: Check if running in browser
  const isBrowser = typeof window !== "undefined";

  // Check reduced motion preference (with SSR guard)
  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    if (!isBrowser || !respectReducedMotion) return;
    
    setReducedMotion(prefersReducedMotion());
    
    // Listen for changes
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [respectReducedMotion, isBrowser]);

  // Compute effective duration
  const effectiveDuration = reducedMotion ? 0 : transitionDuration;

  // Store & API
  const { initialize, endTransition } = useScrollStore();
  const activeIndex = useScrollStore((s) => s.activeIndex);
  const totalViews = useScrollStore((s) => s.totalViews);
  const isInitialized = useScrollStore((s) => s.isInitialized);
  
  const prevIndexRef = useRef(activeIndex);

  // Initialize Input Handlers (all use Intention Model)
  useWheelHandler();
  
  // Only use discrete touch handler if drag physics is DISABLED
  useTouchHandler({ enabled: !enableDragPhysics });
  
  useKeyboardHandler();
  
  // Touch Physics - 1:1 Drag (only if enabled and reduced motion is off)
  const dragState = useDragHandler({ 
    enabled: enableDragPhysics && !reducedMotion,
  });
  
  // Deep Linking (URL Hash Sync)
  useHashSync({
    enabled: enableHashSync,
    pushHistory: hashPushHistory,
    hashPrefix: hashPrefix,
  });

  // Focus Management (Accessibility)
  useFocusManagement({ enabled: enableFocusManagement });

  // Initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      initialize();
      onInitialized?.();
    }, 50);

    return () => clearTimeout(timer);
  }, [initialize, onInitialized]);

  // Handle View Change & Transition
  useEffect(() => {
    if (prevIndexRef.current !== activeIndex) {
      onViewChange?.(prevIndexRef.current, activeIndex);

      // Transition handling (use effective duration)
      const timer = setTimeout(() => {
        endTransition();
      }, effectiveDuration);

      prevIndexRef.current = activeIndex;
      return () => clearTimeout(timer);
    }
  }, [activeIndex, effectiveDuration, onViewChange, endTransition]);

  // Visual Styles (uses effective duration + drag offset + orientation)
  const wrapperStyle = useMemo<React.CSSProperties>(() => {
    const baseOffset = activeIndex * 100;
    
    // Add drag offset during active drag
    const dragOffset = dragState.isDragging 
      ? dragState.dragOffset * 100 
      : 0;
    
    // Horizontal vs Vertical
    const transformAxis = orientation === "horizontal" ? "X" : "Y";
    const sizeUnit = orientation === "horizontal" ? "vw" : "vh";
    
    return {
      transform: `translate${transformAxis}(-${baseOffset + dragOffset}${sizeUnit})`,
      transition: dragState.isDragging 
        ? "none"
        : effectiveDuration > 0 
          ? `transform ${effectiveDuration}ms ${transitionEasing}` 
          : "none",
      height: "100%",
      width: "100%",
      display: orientation === "horizontal" ? "flex" : "block",
      flexDirection: orientation === "horizontal" ? "row" : undefined,
    };
  }, [activeIndex, effectiveDuration, transitionEasing, dragState, orientation]);

  return (
    <div
      ref={containerRef}
      className={`scroll-container fixed inset-0 overflow-hidden w-screen h-screen ${className}`}
      role="main"
      aria-label="Scroll container"
    >
      <div className="scroll-wrapper" style={wrapperStyle}>
        {children}
      </div>
    </div>
  );
}

// Indicator Component (Internal)
function ScrollIndicators({ totalViews, activeIndex }: { totalViews: number; activeIndex: number }) {
  const { goTo } = useScrollSystem();
  
  return (
    <nav className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
      {Array.from({ length: totalViews }).map((_, index) => (
        <button
          key={index}
          onClick={() => goTo(index)}
          className={`
            w-2 h-2 rounded-full transition-all duration-300
            ${index === activeIndex ? "bg-white scale-125" : "bg-white/30 hover:bg-white/50"}
          `}
          aria-label={`Go to section ${index + 1}`}
          aria-current={index === activeIndex ? "true" : undefined}
        />
      ))}
    </nav>
  );
}
