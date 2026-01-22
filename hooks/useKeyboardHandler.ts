/**
 * Scroll System - Keyboard Handler
 * =========================================
 * Captures keyboard input and translates it to navigation intentions.
 * 
 * Supported Keys:
 * - ArrowUp / ArrowDown: Navigate between views
 * - PageUp / PageDown: Navigate between views
 * - Space: Navigate to next view (Shift+Space for previous)
 * - Home / End: Go to first / last view
 */

import { useEffect } from "react";
import { useScrollStore } from "../store";
import type { UserIntention } from "../types";

export interface UseKeyboardHandlerOptions {
  /** Enable/disable keyboard navigation (default: true) */
  enabled?: boolean;
  /** Prevent default behavior for handled keys (default: true) */
  preventDefault?: boolean;
}

export function useKeyboardHandler(options: UseKeyboardHandlerOptions = {}) {
  const { enabled = true, preventDefault = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      let intention: UserIntention | null = null;

      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          intention = {
            type: "navigate",
            direction: "down",
            strength: 1,
            origin: "keyboard",
          };
          break;

        case "ArrowUp":
        case "PageUp":
          intention = {
            type: "navigate",
            direction: "up",
            strength: 1,
            origin: "keyboard",
          };
          break;

        case " ": // Space
          intention = {
            type: "navigate",
            direction: e.shiftKey ? "up" : "down",
            strength: 1,
            origin: "keyboard",
          };
          break;

        case "Home":
          // Go to first view
          useScrollStore.getState().goToView(0);
          if (preventDefault) e.preventDefault();
          return;

        case "End":
          // Go to last view
          const totalViews = useScrollStore.getState().totalViews;
          useScrollStore.getState().goToView(totalViews - 1);
          if (preventDefault) e.preventDefault();
          return;

        default:
          return; // Don't handle other keys
      }

      if (intention) {
        if (preventDefault) e.preventDefault();
        useScrollStore.getState().processIntention(intention);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, preventDefault]);
}

export default useKeyboardHandler;
