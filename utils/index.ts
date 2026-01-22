/**
 * Scroll System - Utility Functions
 * =========================================
 * Performance utilities for the scroll system.
 */

/**
 * Creates a throttled version of a function.
 * The function will only be called at most once per `limit` milliseconds.
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): T {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return ((...args: unknown[]) => {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    if (remaining <= 0) {
      // Enough time has passed, call immediately
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      // Schedule a call for later
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  }) as T;
}

/**
 * Check if user prefers reduced motion.
 * Returns true if the user has enabled "Reduce motion" in their OS settings.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get transition duration respecting reduced motion preference.
 * Returns 0 if user prefers reduced motion, otherwise returns the provided duration.
 */
export function getTransitionDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration;
}
