/**
 * PABRIX Scroll System - Constants
 * =================================
 */

// Configuración de Transiciones
export const DEFAULT_TRANSITION_DURATION = 700;
export const DEFAULT_TRANSITION_EASING = "cubic-bezier(0.645, 0.045, 0.355, 1.000)"; // easeInOutCubic

// Configuración de Scroll
export const DEFAULT_SCROLL_END_THRESHOLD = 0.99;
export const DEFAULT_PROGRESS_DEBOUNCE = 16; // ~1 frame

// Tiempo de espera entre navegaciones (ms)
export const NAVIGATION_COOLDOWN = 500;

// Umbrales de sensibilidad para inputs
export const NAV_THRESHOLDS = {
  WHEEL: 60,   // Acumulado de deltaY para disparar navegación
  TOUCH: 50,   // Píxeles de distancia para considerar swipe
};

// Constantes de Swipe
export const MIN_SWIPE_DISTANCE = 50;
export const MIN_SWIPE_VELOCITY = 0.3;
export const SCROLL_INTENT_THRESHOLD = 40;
