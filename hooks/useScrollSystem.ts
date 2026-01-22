/**
 * Scroll System - Public API Hook
 * =======================================
 * Facade principal para el uso de la librería.
 * Expone una API estable y documentada.
 */

import { useCallback, useMemo } from "react";
import { 
    useScrollStore, 
    selectCanNavigateNext, 
    selectCanNavigatePrevious 
} from "../store";
import type { ScrollSystemAPI } from "../types";

/**
 * Hook principal para consumir el sistema de scroll.
 * Retorna la API pública del sistema.
 */
export function useScrollSystem(): ScrollSystemAPI & { isDragging: boolean; isTransitioning: boolean } {
    // Selectors
    const activeIndex = useScrollStore((s) => s.activeIndex);
    const globalProgress = useScrollStore((s) => s.globalProgress);
    const isGlobalLocked = useScrollStore((s) => s.isGlobalLocked);
    const isTransitioning = useScrollStore((s) => s.isTransitioning);
    const isDragging = useScrollStore((s) => s.isDragging);
    const activeId = useScrollStore((s) => s.activeId);
    const totalViews = useScrollStore((s) => s.totalViews);
    const views = useScrollStore((s) => s.views);
    
    // Actions
    const { 
        goToNext: storeNext, 
        goToPrevious: storePrev, 
        goToView: storeGoTo,
    } = useScrollStore();

    // Active View Data (for external consumers like Nav)
    const activeView = views[activeIndex];
    const activeViewType = activeView?.type ?? null;
    const activeViewProgress = activeView?.progress ?? 0;

    // Computed Capabilities
    const canNavigateNext = useScrollStore(selectCanNavigateNext);
    const canNavigatePrevious = useScrollStore(selectCanNavigatePrevious);

    // API Implementation
    const goToNext = useCallback(() => {
        if (canNavigateNext) {
            storeNext();
            return true;
        }
        return false;
    }, [canNavigateNext, storeNext]);

    const goToPrev = useCallback(() => {
        if (canNavigatePrevious) {
            storePrev();
            return true;
        }
        return false;
    }, [canNavigatePrevious, storePrev]);

    const getCurrentIndex = useCallback(() => activeIndex, [activeIndex]);
    const getProgress = useCallback(() => globalProgress, [globalProgress]);
    const getActiveViewProgress = useCallback(() => activeViewProgress, [activeViewProgress]);
    const isLocked = useCallback(() => isGlobalLocked || isTransitioning || !canNavigateNext, [isGlobalLocked, isTransitioning, canNavigateNext]);

    // Stable Object Return (Extended API for Nav components)
    return useMemo(() => ({
        goToNext,
        goToPrev,
        goTo: storeGoTo,
        getCurrentIndex,
        getProgress,
        getActiveViewProgress,
        isLocked,
        canGoNext: canNavigateNext,
        canGoPrev: canNavigatePrevious,
        // Extended Data for Nav/UI
        activeIndex,
        activeId,
        activeViewType,
        totalViews,
        // State Flags (for advanced use)
        isDragging,
        isTransitioning,
    }), [
        goToNext, 
        goToPrev, 
        storeGoTo, 
        getCurrentIndex, 
        getProgress,
        getActiveViewProgress,
        isLocked, 
        canNavigateNext, 
        canNavigatePrevious,
        activeIndex,
        activeId,
        activeViewType,
        totalViews,
        isDragging,
        isTransitioning,
    ]);
}

