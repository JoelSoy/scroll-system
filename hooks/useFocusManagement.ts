/**
 * Scroll System - Focus Management Hook
 * ======================================
 * Manages focus when navigating between views.
 * Moves focus to the active view section for screen reader accessibility.
 */

import { useEffect, useRef } from "react";
import { useScrollStore } from "../store";

export interface UseFocusManagementOptions {
  /** Enable/disable focus management (default: true) */
  enabled?: boolean;
  /** Delay before moving focus (after transition) */
  focusDelay?: number;
}

/**
 * Hook that manages keyboard focus when views change.
 * Should be called once in ScrollContainer.
 */
export function useFocusManagement(options: UseFocusManagementOptions = {}) {
  const { enabled = true, focusDelay = 100 } = options;
  
  const activeIndex = useScrollStore((s) => s.activeIndex);
  const activeId = useScrollStore((s) => s.activeId);
  const isTransitioning = useScrollStore((s) => s.isTransitioning);
  const prevIndexRef = useRef(activeIndex);

  useEffect(() => {
    if (!enabled) return;
    
    // Only move focus when index actually changes and transition ends
    if (activeIndex !== prevIndexRef.current && !isTransitioning && activeId) {
      const timer = setTimeout(() => {
        // Find the view section element
        const viewElement = document.getElementById(activeId);
        
        if (viewElement) {
          // Make focusable if not already
          if (!viewElement.hasAttribute("tabindex")) {
            viewElement.setAttribute("tabindex", "-1");
          }
          
          // Focus without scrolling (we handle scroll ourselves)
          viewElement.focus({ preventScroll: true });
        }
        
        prevIndexRef.current = activeIndex;
      }, focusDelay);
      
      return () => clearTimeout(timer);
    }
  }, [activeIndex, activeId, isTransitioning, enabled, focusDelay]);
}

export default useFocusManagement;
