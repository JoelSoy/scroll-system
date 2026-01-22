/**
 * PABRIX Scroll System - Navigation Hook
 * =======================================
 * Hook principal para interactuar con el sistema de navegación.
 * Provee una API limpia y tipada para controlar la navegación.
 */

import { useCallback, useMemo } from "react";
import {
  useScrollStore,
  selectCanNavigateNext,
  selectCanNavigatePrevious,
} from "../store";

/**
 * Hook para acceder a la API de navegación del sistema de scroll
 * 
 * @deprecated Use `useScrollSystem` instead. This hook will be removed in future versions.
 *
 * @example
 * ```tsx
 * const { goToView, goToNext, activeIndex } = useNavigation();
 *
 * // Navegar a una vista específica
 * goToView('hero');
 * goToView(2);
 *
 * // Navegar secuencialmente
 * goToNext();
 * goToPrevious();
 * ```
 */
export function useNavigation() {
  // Acciones del store (funciones son estables)
  // Acciones del store (funciones son estables)
  const goToView = useScrollStore((s) => s.goToView);
  const goToNextAction = useScrollStore((s) => s.goToNext);
  const goToPreviousAction = useScrollStore((s) => s.goToPrevious);
  
  // Legacy mapping
  const setGlobalLock = useScrollStore((s) => s.setGlobalLock);
  const lockScroll = useCallback(() => setGlobalLock(true), [setGlobalLock]);
  const unlockScroll = useCallback(() => setGlobalLock(false), [setGlobalLock]);

  // Estado primitivo (selectores estables que retornan primitivos)
  const activeIndex = useScrollStore((s) => s.activeIndex);
  const activeId = useScrollStore((s) => s.activeId);
  const totalViews = useScrollStore((s) => s.totalViews);
  const isTransitioning = useScrollStore((s) => s.isTransitioning);
  const isScrollLocked = useScrollStore((s) => s.isGlobalLocked);

  // Selectores optimizados que retornan booleanos (primitivos)
  const canNavigateNext = useScrollStore(selectCanNavigateNext);
  const canNavigatePrevious = useScrollStore(selectCanNavigatePrevious);

  // Navegación con callbacks estables
  const goToNext = useCallback(() => {
    return goToNextAction();
  }, [goToNextAction]);

  const goToPrevious = useCallback(() => {
    return goToPreviousAction();
  }, [goToPreviousAction]);

  // Valores derivados calculados (sin crear nuevos objetos)
  const isFirstView = activeIndex === 0;
  const isLastView = activeIndex === totalViews - 1;
  const progress = totalViews > 1 ? activeIndex / (totalViews - 1) : 0;

  // API memoizada
  return useMemo(
    () => ({
      // Acciones de navegación
      goToView,
      goToNext,
      goToPrevious,

      // Control de bloqueo
      lockScroll,
      unlockScroll,

      // Estado actual
      activeIndex,
      activeId,
      totalViews,

      // Estados de UI
      isTransitioning,
      isScrollLocked,
      canNavigateNext,
      canNavigatePrevious,

      // Utilidades
      isFirstView,
      isLastView,
      progress,
    }),
    [
      goToView,
      goToNext,
      goToPrevious,
      lockScroll,
      unlockScroll,
      activeIndex,
      activeId,
      totalViews,
      isTransitioning,
      isScrollLocked,
      canNavigateNext,
      canNavigatePrevious,
      isFirstView,
      isLastView,
      progress,
    ]
  );
}
