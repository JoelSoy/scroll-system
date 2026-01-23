/**
 * useGestureConfig Hook
 * ========================================
 * Manages gesture configuration for scroll interactions.
 * Allows customization of swipe thresholds, velocities, and input methods.
 */

import { useMemo, createContext, useContext } from "react";
import type { GestureConfig } from "../types";

const DEFAULT_GESTURE_CONFIG: Required<GestureConfig> = {
  swipeThreshold: 50,
  swipeVelocity: 0.5,
  dragResistance: 0.3,
  enableWheel: true,
  enableTouch: true,
  enableKeyboard: true,
};

// Context for gesture config
export const GestureConfigContext = createContext<Required<GestureConfig>>(DEFAULT_GESTURE_CONFIG);

/**
 * Hook to access gesture configuration.
 * 
 * @example
 * ```tsx
 * const { swipeThreshold, swipeVelocity } = useGestureConfig();
 * 
 * // In touch handler:
 * if (Math.abs(deltaY) > swipeThreshold || velocity > swipeVelocity) {
 *   navigate();
 * }
 * ```
 */
export function useGestureConfig(): Required<GestureConfig> {
  return useContext(GestureConfigContext);
}

/**
 * Merge user config with defaults.
 */
export function mergeGestureConfig(
  config?: GestureConfig
): Required<GestureConfig> {
  return useMemo(() => ({
    ...DEFAULT_GESTURE_CONFIG,
    ...config,
  }), [config]);
}

/**
 * Check if a gesture exceeds the threshold.
 */
export function isGestureTriggered(
  config: GestureConfig,
  deltaX: number,
  deltaY: number,
  velocity: number,
  direction: "vertical" | "horizontal"
): boolean {
  const threshold = config.swipeThreshold ?? DEFAULT_GESTURE_CONFIG.swipeThreshold;
  const velocityThreshold = config.swipeVelocity ?? DEFAULT_GESTURE_CONFIG.swipeVelocity;
  
  const delta = direction === "vertical" ? Math.abs(deltaY) : Math.abs(deltaX);
  
  // Trigger if either distance or velocity threshold is met
  return delta >= threshold || velocity >= velocityThreshold;
}

/**
 * Calculate resistance factor for boundary dragging.
 */
export function calculateResistance(
  config: GestureConfig,
  offset: number,
  isAtBoundary: boolean
): number {
  if (!isAtBoundary) return offset;
  
  const resistance = config.dragResistance ?? DEFAULT_GESTURE_CONFIG.dragResistance;
  
  // Apply rubber-band effect
  // The further you drag, the more resistance
  return offset * (1 - resistance * Math.min(1, Math.abs(offset) / 100));
}

export { DEFAULT_GESTURE_CONFIG };
