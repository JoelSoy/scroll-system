/**
 * PABRIX Scroll System - Navigation Store
 * ========================================
 * Store principal de Zustand con Arquitectura Determinística.
 * Implementa State Machine explícita y Modelo de Intención.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  ScrollSystemStore,
  ScrollSystemState,
  ViewConfig,
  ViewState,
  ViewMetrics,
  ScrollCapability,
  NavigationState,
  UserIntention,
} from "../types";
import { NAVIGATION_COOLDOWN } from "../constants";

// ============================================
// State Machine (Formalized)
// ============================================

function evaluateStateMachine(
  capability: ScrollCapability,
  progress: number,
  viewType: ViewConfig["type"],
  explicitLock: NavigationState | null
): NavigationState {
  
  if (explicitLock) return explicitLock;
  if (capability === "none") return "unlocked";
  if (viewType === "full") return "unlocked";
  
  // Tolerance 0.99 ensures user feels the "end" before unlocking
  if (progress >= 0.99) return "unlocked";
  
  return "locked";
}

function calculateCapability(metrics: ViewMetrics): ScrollCapability {
  if (metrics.scrollHeight - metrics.clientHeight <= 1) {
    return "none";
  }
  return "internal";
}

function calculateProgress(metrics: ViewMetrics): number {
  const maxScroll = metrics.scrollHeight - metrics.clientHeight;
  if (maxScroll <= 1) return 1;
  return Math.max(0, Math.min(1, metrics.scrollTop / maxScroll));
}

// ============================================
// Store Implementation
// ============================================

const initialState: ScrollSystemState = {
  views: [],
  activeIndex: 0,
  activeId: null,
  totalViews: 0,
  isInitialized: false,
  isTransitioning: false,
  isGlobalLocked: false,
  isDragging: false,
  globalProgress: 0,
};

let lastNavigationTime = 0;

export const useScrollStore = create<ScrollSystemStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    initialize: () => {
      const { views } = get();
      if (views.length > 0) {
        set({
          isInitialized: true,
          activeId: views[0]?.id ?? null,
          activeIndex: 0,
        });
      }
    },

    registerView: (config: ViewConfig) => {
      set((state) => {
        if (state.views.some((v) => v.id === config.id)) return state;

        const newIndex = state.views.length;
        const newView: ViewState = {
          id: config.id,
          index: newIndex,
          type: config.type,
          isActive: newIndex === 0,
          capability: "none",
          navigation: "unlocked",
          explicitLock: null,
          progress: 0,
          metrics: { scrollHeight: 0, clientHeight: 0, scrollTop: 0 },
          config,
        };

        const newViews = [...state.views, newView];

        return {
          views: newViews,
          totalViews: newViews.length,
          activeId: state.activeId ?? newView.id,
        };
      });
    },

    unregisterView: (id: string) => {
      set((state) => {
        const newViews = state.views
          .filter((v) => v.id !== id)
          .map((v, idx) => ({ ...v, index: idx }));

        const newActiveIndex = Math.min(state.activeIndex, newViews.length - 1);

        return {
          views: newViews,
          totalViews: newViews.length,
          activeIndex: Math.max(0, newActiveIndex),
          activeId: newViews[newActiveIndex]?.id ?? null,
        };
      });
    },

    updateViewMetrics: (id: string, metrics: ViewMetrics) => {
      set((state) => {
        const viewIndex = state.views.findIndex(v => v.id === id);
        if (viewIndex === -1) return state;

        const view = state.views[viewIndex];
        
        const capability = calculateCapability(metrics);
        const progress = calculateProgress(metrics);
        const navigation = evaluateStateMachine(capability, progress, view.type, view.explicitLock);
        
        if (
          view.capability === capability &&
          Math.abs(view.progress - progress) < 0.0001 &&
          view.navigation === navigation
        ) {
          return state;
        }

        const newViews = [...state.views];
        newViews[viewIndex] = {
          ...view,
          metrics,
          capability,
          progress,
          navigation,
        };

        return { views: newViews };
      });
    },

    processIntention: (intention: UserIntention): boolean => {
      const state = get();
      
      if (state.isTransitioning || state.isGlobalLocked) return false;
      
      const activeView = state.views[state.activeIndex];
      if (!activeView) return false;

      if (intention.type === "navigate") {
         if (intention.direction === "down") {
             // For DOWN, we strictly obey the 'locked' state (which means "finish content first")
             if (activeView.navigation === "locked") return false;
             
             if (state.activeIndex < state.totalViews - 1) {
                 get().goToView(state.activeIndex + 1);
                 return true;
             }
         } else if (intention.direction === "up") {
             // For UP, we allow exit if:
             // 1. We are NOT explicitly locked (ControlledView blocking exit? Maybe not common)
             // 2. We are visually at the top (scrollTop approx 0)
             
             // Check if visually at top
             // Note: progress calculation might be 0 even if scrollTop is 0.
             const isAtTop = activeView.metrics.scrollTop <= 1; // 1px tolerance

             if (activeView.capability === "internal" && !isAtTop) {
                 // If we have room to scroll up, we do NOT navigate. We let native scroll happen.
                 return false;
             }
             
             // Controlled View Back Navigation Logic
             if (activeView.type === "controlled") {
                 // Cast config to specific type since ViewState generic is loose
                 const config = activeView.config as import("../types").ControlledViewConfig;
                 
                 // If allowGoBack is explicitly set to false, we block.
                 if (config.allowGoBack === false) {
                    return false;
                 }
                 // Otherwise (undefined or true), we allow going back EVEN IF explicitLock is "locked"
                 // This effectively ignores the "canProceed" lock for backward navigation.
             } else {
                 // For non-controlled views, standard behavior:
                 // If explicitLock is "locked", we MIGHT block, but usually "locked" means "cannot finish".
                 // Detailed rule: Explicit lock usually blocks everything. 
                 // But let's assume default is: Back is allowed unless specified.
                 if (activeView.explicitLock === "locked") return false; 
             }
             
             // If we are just "locked" because of internal content (but we are at top), we ALLOW exit.
             // So we ignore activeView.navigation being "locked" here.

             if (state.activeIndex > 0) {
                 get().goToView(state.activeIndex - 1);
                 return true;
             }
         }
      }

      return false;
    },

    goToNext: () => {
        const state = get();
        state.goToView(state.activeIndex + 1);
    },

    goToPrevious: () => {
        const state = get();
        state.goToView(state.activeIndex - 1);
    },

    goToView: (indexOrId: number | string) => {
      const state = get();
      const now = Date.now();
      if (now - lastNavigationTime < NAVIGATION_COOLDOWN) return;
      lastNavigationTime = now;

      let targetIndex = typeof indexOrId === "string" 
        ? state.views.findIndex(v => v.id === indexOrId)
        : indexOrId;

      if (targetIndex < 0 || targetIndex >= state.totalViews) return;
      if (targetIndex === state.activeIndex) return;

      set((s) => ({
        ...s,
        isTransitioning: true,
        activeIndex: targetIndex,
        activeId: s.views[targetIndex]?.id ?? null,
        views: s.views.map(v => {
            if (v.index === targetIndex) return { ...v, isActive: true };
            if (v.index === s.activeIndex) return { ...v, isActive: false };
            return v;
        })
      }));
    },

    setViewExplicitLock: (id: string, lock: NavigationState | null) => {
        set((state) => {
            const index = state.views.findIndex(v => v.id === id);
            if (index === -1) return state;
            
            const view = state.views[index];
            const navigation = evaluateStateMachine(view.capability, view.progress, view.type, lock);
            
            const newViews = [...state.views];
            newViews[index] = { ...view, explicitLock: lock, navigation };
            
            return { views: newViews };
        });
    },

    setGlobalLock: (locked: boolean) => set({ isGlobalLocked: locked }),
    
    setDragging: (dragging: boolean) => set({ isDragging: dragging }),

    getViewById: (id: string) => get().views.find((v) => v.id === id),

    startTransition: () => set({ isTransitioning: true }),
    endTransition: () => set({ isTransitioning: false }),
    
    resetNavigationCooldown: () => {
        lastNavigationTime = 0;
    }
  }))
);

// Selectors
export const selectActiveView = (state: ScrollSystemStore) =>
  state.views[state.activeIndex];

export const selectActiveViewProgress = (state: ScrollSystemStore) =>
  state.views[state.activeIndex]?.progress ?? 0;

export const selectCanNavigateNext = (state: ScrollSystemStore) => {
  if (state.isTransitioning || state.isGlobalLocked) return false;
  const activeView = state.views[state.activeIndex];
  if (!activeView) return false;
  return activeView.navigation === "unlocked";
};

export const selectCanNavigatePrevious = (state: ScrollSystemStore) => {
    if (state.isTransitioning || state.isGlobalLocked) return false;
    return state.activeIndex > 0;
};
