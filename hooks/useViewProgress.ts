/**
 * PABRIX Scroll System - View Progress Hook (Read Only)
 * ======================================================
 * Hook para obtener el progreso de scroll de una vista desde el Store.
 * NOTA: Ya no actualiza el progreso, solo lo lee.
 * Las actualizaciones ocurren vía useMetricsReporter.
 */

import { useScrollStore, selectActiveViewProgress } from "../store";
import type { NavigationState } from "../types";

interface UseViewProgressResult {
  progress: number;
  isAtStart: boolean;
  isAtEnd: boolean;
  navigation: NavigationState;
}

export function useViewProgress(viewId: string): UseViewProgressResult {
  const progress = useScrollStore(
    (s) => s.views.find((v) => v.id === viewId)?.progress ?? 0
  );
  
  // Use correct property 'navigation' from ViewState
  const navigation = useScrollStore(
    (s) => s.views.find((v) => v.id === viewId)?.navigation ?? "unlocked"
  );

  const isAtStart = progress <= 0.02;
  const isAtEnd = progress >= 0.99;

  return {
    progress,
    isAtStart,
    isAtEnd,
    navigation,
  };
}

export function useActiveViewProgress() {
  const progress = useScrollStore(selectActiveViewProgress);
  const activeView = useScrollStore((s) => s.views[s.activeIndex]);
  
  const hasInternalScroll = activeView?.capability === "internal";

  return {
    progress,
    hasInternalScroll,
    viewType: activeView?.type,
  };
}
