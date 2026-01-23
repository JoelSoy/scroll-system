/**
 * Scroll System - Navigation Store
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
  if (viewType === "nested") return "unlocked"; // Nested views handle scroll internally
  
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
  // NEW: AutoScroll state
  isAutoScrolling: false,
  isAutoScrollPaused: false,
  // NEW: Infinite scroll
  infiniteScrollEnabled: false,
  // NEW: Last navigation direction
  lastNavigationDirection: null,
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
          isPreloaded: newIndex <= 1, // Preload first 2 views by default
          capability: "none",
          navigation: "unlocked",
          explicitLock: null,
          progress: 0,
          metrics: { scrollHeight: 0, clientHeight: 0, scrollTop: 0 },
          config,
          activeSnapPointId: null,
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

        // Calculate global progress
        const activeView = newViews[state.activeIndex];
        const viewProgress = activeView?.progress ?? 0;
        const globalProgress = (state.activeIndex + viewProgress) / state.totalViews;

        return { views: newViews, globalProgress };
      });
    },

    processIntention: (intention: UserIntention): boolean => {
      const state = get();
      
      if (state.isTransitioning || state.isGlobalLocked) return false;
      
      const activeView = state.views[state.activeIndex];
      if (!activeView) return false;

      if (intention.type === "navigate") {
         if (intention.direction === "down") {
             if (activeView.navigation === "locked") return false;
             
             // Handle infinite scroll
             if (state.activeIndex >= state.totalViews - 1) {
               if (state.infiniteScrollEnabled) {
                 get().goToView(0);
                 return true;
               }
               return false;
             }
             
             get().goToView(state.activeIndex + 1);
             return true;
         } else if (intention.direction === "up") {
             const isAtTop = activeView.metrics.scrollTop <= 1;

             if (activeView.capability === "internal" && !isAtTop) {
                 return false;
             }
             
             if (activeView.type === "controlled") {
                 const config = activeView.config as import("../types").ControlledViewConfig;
                 if (config.allowGoBack === false) {
                    return false;
                 }
             } else {
                 if (activeView.explicitLock === "locked") return false; 
             }
             
             // Handle infinite scroll backward
             if (state.activeIndex <= 0) {
               if (state.infiniteScrollEnabled) {
                 get().goToView(state.totalViews - 1);
                 return true;
               }
               return false;
             }

             get().goToView(state.activeIndex - 1);
             return true;
         }
      }

      return false;
    },

    goToNext: () => {
        const state = get();
        const nextIndex = state.infiniteScrollEnabled && state.activeIndex >= state.totalViews - 1
          ? 0
          : state.activeIndex + 1;
        state.goToView(nextIndex);
    },

    goToPrevious: () => {
        const state = get();
        const prevIndex = state.infiniteScrollEnabled && state.activeIndex <= 0
          ? state.totalViews - 1
          : state.activeIndex - 1;
        state.goToView(prevIndex);
    },

    goToView: (indexOrId: number | string) => {
      const state = get();
      const now = Date.now();
      if (now - lastNavigationTime < NAVIGATION_COOLDOWN) return;
      lastNavigationTime = now;

      let targetIndex = typeof indexOrId === "string" 
        ? state.views.findIndex(v => v.id === indexOrId)
        : indexOrId;

      // Handle infinite scroll wrap
      if (state.infiniteScrollEnabled) {
        if (targetIndex < 0) targetIndex = state.totalViews - 1;
        if (targetIndex >= state.totalViews) targetIndex = 0;
      }

      if (targetIndex < 0 || targetIndex >= state.totalViews) return;
      if (targetIndex === state.activeIndex) return;

      set((s) => {
        // Determine navigation direction
        const navigationDirection = targetIndex > s.activeIndex ? "down" : "up";
        
        // Update preload status for adjacent views
        const newViews = s.views.map((v, idx) => {
          const isAdjacent = Math.abs(idx - targetIndex) <= 1 ||
            (s.infiniteScrollEnabled && (
              (targetIndex === 0 && idx === s.totalViews - 1) ||
              (targetIndex === s.totalViews - 1 && idx === 0)
            ));
          
          return {
            ...v,
            isActive: idx === targetIndex,
            isPreloaded: isAdjacent || idx === targetIndex,
          };
        });

        return {
          ...s,
          isTransitioning: true,
          activeIndex: targetIndex,
          activeId: newViews[targetIndex]?.id ?? null,
          views: newViews,
          lastNavigationDirection: navigationDirection,
        };
      });
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

    startTransition: () => set({ isTransitioning: true }),
    endTransition: () => set({ isTransitioning: false }),
    
    // NEW: AutoScroll control
    setAutoScrolling: (enabled: boolean) => set({ isAutoScrolling: enabled }),
    setAutoScrollPaused: (paused: boolean) => set({ isAutoScrollPaused: paused }),
    
    // NEW: Infinite scroll
    setInfiniteScrollEnabled: (enabled: boolean) => set({ infiniteScrollEnabled: enabled }),
    
    // NEW: Preload
    setViewPreloaded: (id: string, preloaded: boolean) => {
      set((state) => {
        const index = state.views.findIndex(v => v.id === id);
        if (index === -1) return state;
        
        const newViews = [...state.views];
        newViews[index] = { ...newViews[index], isPreloaded: preloaded };
        
        return { views: newViews };
      });
    },
    
    // NEW: Snap points
    setActiveSnapPoint: (viewId: string, snapPointId: string | null) => {
      set((state) => {
        const index = state.views.findIndex(v => v.id === viewId);
        if (index === -1) return state;
        
        const newViews = [...state.views];
        newViews[index] = { ...newViews[index], activeSnapPointId: snapPointId };
        
        return { views: newViews };
      });
    },
    
    resetNavigationCooldown: () => {
        lastNavigationTime = 0;
    }
  }))
);

// ============================================
// Selectors
// ============================================

export const selectActiveView = (state: ScrollSystemStore) =>
  state.views[state.activeIndex];

export const selectActiveViewProgress = (state: ScrollSystemStore) =>
  state.views[state.activeIndex]?.progress ?? 0;

export const selectCanNavigateNext = (state: ScrollSystemStore) => {
  if (state.isTransitioning || state.isGlobalLocked) return false;
  const activeView = state.views[state.activeIndex];
  if (!activeView) return false;
  if (state.infiniteScrollEnabled) return activeView.navigation === "unlocked";
  return activeView.navigation === "unlocked" && state.activeIndex < state.totalViews - 1;
};

export const selectCanNavigatePrevious = (state: ScrollSystemStore) => {
    if (state.isTransitioning || state.isGlobalLocked) return false;
    const activeView = state.views[state.activeIndex];
    if (!activeView) return false;
    // With infinite scroll, can always navigate previous (it wraps)
    if (state.infiniteScrollEnabled) return true;
    // Without infinite scroll, check if we're not at the first view
    return state.activeIndex > 0;
};

export const selectGlobalProgress = (state: ScrollSystemStore) =>
  state.globalProgress;

export const selectIsAutoScrolling = (state: ScrollSystemStore) =>
  state.isAutoScrolling && !state.isAutoScrollPaused;
