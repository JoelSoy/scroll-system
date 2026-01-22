/**
 * Scroll System - View Registration Hook
 * ==============================================
 * Hook para registrar vistas en el sistema.
 * Maneja el ciclo de vida de registro/des-registro.
 */

import { useEffect, useRef } from "react";
import { useScrollStore } from "../store";
import type { ViewConfig } from "../types";

interface UseViewRegistrationOptions {
  config: ViewConfig;
  onActivate?: () => void;
  onDeactivate?: () => void;
  // Transition callbacks
  onEnterStart?: () => void;
  onEnterEnd?: () => void;
  onExitStart?: () => void;
  onExitEnd?: () => void;
}

export function useViewRegistration({
  config,
  onActivate,
  onDeactivate,
  onEnterStart,
  onEnterEnd,
  onExitStart,
  onExitEnd,
}: UseViewRegistrationOptions) {
  // Use stable selectors
  const registerView = useScrollStore((s) => s.registerView);
  const unregisterView = useScrollStore((s) => s.unregisterView);
  const activeId = useScrollStore((s) => s.activeId);
  const isTransitioning = useScrollStore((s) => s.isTransitioning);

  // Callbacks ref (to avoid re-renders on callback changes)
  const callbacksRef = useRef({ 
    onActivate, onDeactivate, 
    onEnterStart, onEnterEnd, onExitStart, onExitEnd 
  });
  callbacksRef.current = { 
    onActivate, onDeactivate, 
    onEnterStart, onEnterEnd, onExitStart, onExitEnd 
  };
  
  // Track previous states
  const wasActiveRef = useRef(false);
  const wasTransitioningRef = useRef(false);

  // Configuration Ref to prevent unnecessary effect triggers
  const configRef = useRef(config);
  if (JSON.stringify(config) !== JSON.stringify(configRef.current)) {
    configRef.current = config;
  }

  // Registration
  useEffect(() => {
    const currentConfig = configRef.current;
    registerView(currentConfig);
    return () => unregisterView(currentConfig.id);
  }, [registerView, unregisterView, configRef.current]);

  // Get current state
  const viewState = useScrollStore(s => s.views.find(v => v.id === config.id));
  const isActive = activeId === config.id;

  // Activation/Deactivation callbacks
  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      callbacksRef.current.onActivate?.();
    } else if (!isActive && wasActiveRef.current) {
      callbacksRef.current.onDeactivate?.();
    }
    wasActiveRef.current = isActive;
  }, [isActive]);

  // Transition callbacks
  useEffect(() => {
    const callbacks = callbacksRef.current;
    const wasActive = wasActiveRef.current;
    const wasTransitioning = wasTransitioningRef.current;

    // Transition STARTED
    if (isTransitioning && !wasTransitioning) {
      if (isActive && !wasActive) {
        // This view is ENTERING
        callbacks.onEnterStart?.();
      } else if (!isActive && wasActive) {
        // This view is EXITING
        callbacks.onExitStart?.();
      }
    }

    // Transition ENDED
    if (!isTransitioning && wasTransitioning) {
      if (isActive) {
        // This view finished ENTERING
        callbacks.onEnterEnd?.();
      } else if (wasActive && !isActive) {
        // This view finished EXITING
        callbacks.onExitEnd?.();
      }
    }

    wasTransitioningRef.current = isTransitioning;
  }, [isTransitioning, isActive]);

  return {
    isActive,
    viewState,
    index: viewState?.index ?? -1,
    scrollProgress: viewState?.progress ?? 0,
    navigation: viewState?.navigation ?? "unlocked",
  };
}

