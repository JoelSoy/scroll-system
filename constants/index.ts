/**
 * PABRIX Scroll System - Constants
 * =================================
 * Constantes de configuración del sistema de scroll.
 */

/** Duración por defecto de las transiciones en ms */
export const DEFAULT_TRANSITION_DURATION = 600;

/** Easing por defecto para transiciones */
export const DEFAULT_TRANSITION_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Umbral por defecto para detectar fin del scroll (98%) */
export const DEFAULT_SCROLL_END_THRESHOLD = 0.98;

/** Debounce por defecto para cálculo de progreso en ms */
export const DEFAULT_PROGRESS_DEBOUNCE = 16;

/** Umbral mínimo de delta para detectar intención de scroll */
export const SCROLL_INTENT_THRESHOLD = 10;

/** Tiempo de cooldown entre navegaciones en ms */
export const NAVIGATION_COOLDOWN = 100;

/** Tiempo máximo para considerar un scroll como "rápido" */
export const FAST_SCROLL_THRESHOLD = 50;

/** Factor de inercia para scroll táctil */
export const TOUCH_INERTIA_FACTOR = 0.95;

/** Distancia mínima de swipe para activar navegación */
export const MIN_SWIPE_DISTANCE = 50;

/** Velocidad mínima de swipe para activar navegación */
export const MIN_SWIPE_VELOCITY = 0.5;
