/**
 * Scroll System - Hash Sync Handler
 * ==========================================
 * Synchronizes active view with URL hash for deep linking.
 * 
 * Features:
 * - Updates URL hash when view changes (pushState or replaceState)
 * - Navigates to view when URL hash changes (popstate)
 * - Handles initial load navigation based on hash
 * 
 * Usage:
 *   useHashSync({ enabled: true, pushHistory: true })
 */

import { useEffect, useRef } from "react";
import { useScrollStore } from "../store";

export interface UseHashSyncOptions {
  /** Enable/disable hash syncing (default: true) */
  enabled?: boolean;
  /** Use pushState (true) or replaceState (false) for hash updates (default: false) */
  pushHistory?: boolean;
  /** Prefix for hash (e.g., "view-" creates "#view-0") (default: "") */
  hashPrefix?: string;
}

export function useHashSync(options: UseHashSyncOptions = {}) {
  const { enabled = true, pushHistory = false, hashPrefix = "" } = options;
  const hasInitialized = useRef(false);

  // Listen to store changes and update URL hash
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = useScrollStore.subscribe(
      (state) => state.activeIndex,
      (activeIndex, prevIndex) => {
        if (!hasInitialized.current) return; // Skip during initialization
        if (activeIndex === prevIndex) return;

        const views = useScrollStore.getState().views;
        const activeView = views[activeIndex];
        
        if (activeView) {
          const hash = `#${hashPrefix}${activeView.id}`;
          
          if (pushHistory) {
            window.history.pushState(null, "", hash);
          } else {
            window.history.replaceState(null, "", hash);
          }
        }
      }
    );

    return () => unsubscribe();
  }, [enabled, pushHistory, hashPrefix]);

  // Handle popstate (back/forward navigation)
  useEffect(() => {
    if (!enabled) return;

    const handlePopState = () => {
      const hash = window.location.hash.slice(1); // Remove #
      if (!hash) return;

      const viewId = hashPrefix ? hash.replace(hashPrefix, "") : hash;
      const views = useScrollStore.getState().views;
      const targetIndex = views.findIndex((v) => v.id === viewId);

      if (targetIndex !== -1) {
        useScrollStore.getState().goToView(targetIndex);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [enabled, hashPrefix]);

  // Handle initial load based on hash
  useEffect(() => {
    if (!enabled) return;

    // Wait for views to be registered
    const checkAndNavigate = () => {
      const state = useScrollStore.getState();
      if (!state.isInitialized || state.views.length === 0) {
        // Retry after a short delay
        setTimeout(checkAndNavigate, 100);
        return;
      }

      const hash = window.location.hash.slice(1);
      if (!hash) {
        hasInitialized.current = true;
        return;
      }

      const viewId = hashPrefix ? hash.replace(hashPrefix, "") : hash;
      const targetIndex = state.views.findIndex((v) => v.id === viewId);

      if (targetIndex !== -1 && targetIndex !== state.activeIndex) {
        state.goToView(targetIndex);
      }

      hasInitialized.current = true;
    };

    checkAndNavigate();
  }, [enabled, hashPrefix]);
}

export default useHashSync;
