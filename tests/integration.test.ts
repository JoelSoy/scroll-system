/**
 * Scroll System - Integration Tests
 * ==================================
 * Tests that verify complete user flows and component interactions.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useScrollStore, selectCanNavigateNext, selectCanNavigatePrevious } from "../store";
import type { UserIntention, ViewState } from "../types";

// ============================================
// Test Utilities
// ============================================

function resetStore() {
  useScrollStore.setState({
    views: [],
    activeIndex: 0,
    activeId: null,
    totalViews: 0,
    isTransitioning: false,
    isDragging: false,
    isGlobalLocked: false,
    globalProgress: 0,
    isAutoScrolling: false,
    isAutoScrollPaused: false,
    infiniteScrollEnabled: false,
  });
  useScrollStore.getState().resetNavigationCooldown();
}

// ============================================
// Integration Test Suite
// ============================================

describe("Integration Tests", () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ------------------------------------------
  // Test 1: Full Navigation Flow
  // ------------------------------------------
  describe("Full Navigation Flow", () => {
    it("should navigate through 5 views with wheel intentions", () => {
      const store = useScrollStore.getState();

      // Register 5 views
      for (let i = 0; i < 5; i++) {
        store.registerView({ id: `view-${i}`, type: "full" });
      }

      expect(useScrollStore.getState().totalViews).toBe(5);
      expect(useScrollStore.getState().activeIndex).toBe(0);

      // Navigate through all views
      for (let i = 0; i < 4; i++) {
        const intention: UserIntention = {
          type: "navigate",
          direction: "down",
          strength: 1,
          origin: "wheel",
        };
        
        const handled = store.processIntention(intention);
        expect(handled).toBe(true);
        
        store.endTransition();
        store.resetNavigationCooldown();
      }

      expect(useScrollStore.getState().activeIndex).toBe(4);

      // Try to navigate past last view (should fail without infinite scroll)
      store.resetNavigationCooldown();
      const extraIntention: UserIntention = {
        type: "navigate",
        direction: "down",
        strength: 1,
        origin: "wheel",
      };
      expect(store.processIntention(extraIntention)).toBe(false);
    });

    it("should navigate backwards correctly", () => {
      const store = useScrollStore.getState();

      for (let i = 0; i < 3; i++) {
        store.registerView({ id: `view-${i}`, type: "full" });
      }

      // Go to last view
      store.goToView(2);
      store.endTransition();
      store.resetNavigationCooldown();
      expect(useScrollStore.getState().activeIndex).toBe(2);

      // Navigate back
      const backIntention: UserIntention = {
        type: "navigate",
        direction: "up",
        strength: 1,
        origin: "wheel",
      };

      store.processIntention(backIntention);
      store.endTransition();
      store.resetNavigationCooldown();
      expect(useScrollStore.getState().activeIndex).toBe(1);

      store.processIntention(backIntention);
      store.endTransition();
      store.resetNavigationCooldown();
      expect(useScrollStore.getState().activeIndex).toBe(0);

      // Should not go past first view
      store.resetNavigationCooldown();
      expect(store.processIntention(backIntention)).toBe(false);
    });
  });

  // ------------------------------------------
  // Test 2: ScrollLockedView Internal Scroll
  // ------------------------------------------
  describe("ScrollLockedView Internal Scroll Navigation", () => {
    it("should block navigation when scroll-locked view has internal scroll not at boundary (navigation=locked)", () => {
      const store = useScrollStore.getState();

      store.registerView({ id: "view-0", type: "full" });
      store.registerView({ id: "scroll-locked-view", type: "scroll-locked", scrollDirection: "vertical" });
      store.registerView({ id: "view-2", type: "full" });

      // Go to scroll-locked view
      store.goToView(1);
      store.endTransition();
      store.resetNavigationCooldown();

      // Update metrics to simulate internal scroll (not at bottom)
      store.updateViewMetrics("scroll-locked-view", {
        scrollTop: 100,
        scrollHeight: 500,
        clientHeight: 200,
      });

      const state = useScrollStore.getState();
      const scrollLockedView = state.views.find(v => v.id === "scroll-locked-view");
      expect(scrollLockedView?.capability).toBe("internal");
      // When scroll is not at bottom, navigation is LOCKED
      expect(scrollLockedView?.navigation).toBe("locked");

      // Store BLOCKS navigation because navigation state is locked
      const downIntention: UserIntention = {
        type: "navigate",
        direction: "down",
        strength: 1,
        origin: "wheel",
      };
      
      store.resetNavigationCooldown();
      const handled = store.processIntention(downIntention);
      // Store blocks because navigation === "locked"
      expect(handled).toBe(false);
    });

    it("should allow navigation when scroll-locked view is at bottom boundary", () => {
      const store = useScrollStore.getState();

      store.registerView({ id: "view-0", type: "full" });
      store.registerView({ id: "scroll-locked-view", type: "scroll-locked", scrollDirection: "vertical" });
      store.registerView({ id: "view-2", type: "full" });

      store.goToView(1);
      store.endTransition();
      store.resetNavigationCooldown();

      // Simulate being at bottom
      store.updateViewMetrics("scroll-locked-view", {
        scrollTop: 300,
        scrollHeight: 500,
        clientHeight: 200,
      });

      const state = useScrollStore.getState();
      const scrollLockedView = state.views.find(v => v.id === "scroll-locked-view");
      expect(scrollLockedView?.navigation).toBe("unlocked");

      const downIntention: UserIntention = {
        type: "navigate",
        direction: "down",
        strength: 1,
        origin: "wheel",
      };
      
      store.resetNavigationCooldown();
      expect(store.processIntention(downIntention)).toBe(true);
      expect(useScrollStore.getState().activeIndex).toBe(2);
    });
  });

  // ------------------------------------------
  // Test 3: InfiniteScroll Loop
  // ------------------------------------------
  describe("InfiniteScroll Loop", () => {
    it("should wrap from last view to first view", () => {
      const store = useScrollStore.getState();

      store.setInfiniteScrollEnabled(true);

      for (let i = 0; i < 3; i++) {
        store.registerView({ id: `view-${i}`, type: "full" });
      }

      store.goToView(2);
      store.endTransition();
      store.resetNavigationCooldown();
      expect(useScrollStore.getState().activeIndex).toBe(2);

      const downIntention: UserIntention = {
        type: "navigate",
        direction: "down",
        strength: 1,
        origin: "wheel",
      };

      store.processIntention(downIntention);
      store.endTransition();
      expect(useScrollStore.getState().activeIndex).toBe(0);
    });

    it("should wrap from first view to last view", () => {
      const store = useScrollStore.getState();

      store.setInfiniteScrollEnabled(true);

      for (let i = 0; i < 3; i++) {
        store.registerView({ id: `view-${i}`, type: "full" });
      }

      expect(useScrollStore.getState().activeIndex).toBe(0);

      const upIntention: UserIntention = {
        type: "navigate",
        direction: "up",
        strength: 1,
        origin: "wheel",
      };

      store.resetNavigationCooldown();
      store.processIntention(upIntention);
      store.endTransition();
      expect(useScrollStore.getState().activeIndex).toBe(2);
    });

    it("should complete a full loop forward and backward", () => {
      const store = useScrollStore.getState();
      store.setInfiniteScrollEnabled(true);

      for (let i = 0; i < 3; i++) {
        store.registerView({ id: `view-${i}`, type: "full" });
      }

      const downIntention: UserIntention = {
        type: "navigate",
        direction: "down",
        strength: 1,
        origin: "wheel",
      };

      // Forward loop: 0 -> 1 -> 2 -> 0
      for (let i = 0; i < 3; i++) {
        store.resetNavigationCooldown();
        store.processIntention(downIntention);
        store.endTransition();
      }
      expect(useScrollStore.getState().activeIndex).toBe(0);

      // Backward loop: 0 -> 2 -> 1 -> 0
      const upIntention: UserIntention = {
        type: "navigate",
        direction: "up",
        strength: 1,
        origin: "wheel",
      };

      for (let i = 0; i < 3; i++) {
        store.resetNavigationCooldown();
        store.processIntention(upIntention);
        store.endTransition();
      }
      expect(useScrollStore.getState().activeIndex).toBe(0);
    });
  });

  // ------------------------------------------
  // Test 4: AutoScroll State
  // ------------------------------------------
  describe("AutoScroll State", () => {
    it("should track auto-scroll state correctly", () => {
      const store = useScrollStore.getState();

      store.setAutoScrolling(true);
      expect(useScrollStore.getState().isAutoScrolling).toBe(true);

      store.setAutoScrollPaused(true);
      expect(useScrollStore.getState().isAutoScrollPaused).toBe(true);

      store.setAutoScrollPaused(false);
      expect(useScrollStore.getState().isAutoScrollPaused).toBe(false);
    });

    it("should track dragging state", () => {
      const store = useScrollStore.getState();

      store.setDragging(true);
      expect(useScrollStore.getState().isDragging).toBe(true);

      store.setDragging(false);
      expect(useScrollStore.getState().isDragging).toBe(false);
    });
  });

  // ------------------------------------------
  // Test 5: Transition Blocking
  // ------------------------------------------
  describe("Transition Blocking", () => {
    it("should block all intentions during transitions", () => {
      const store = useScrollStore.getState();

      store.registerView({ id: "view-0", type: "full" });
      store.registerView({ id: "view-1", type: "full" });

      store.startTransition();

      const intention: UserIntention = {
        type: "navigate",
        direction: "down",
        strength: 1,
        origin: "touch",
      };

      store.resetNavigationCooldown();
      expect(store.processIntention(intention)).toBe(false);

      store.endTransition();
      store.resetNavigationCooldown();
      expect(store.processIntention(intention)).toBe(true);
    });
  });

  // ------------------------------------------
  // Test 6: ControlledView Navigation
  // ------------------------------------------
  describe("ControlledView Navigation Control", () => {
    it("should block going back when allowGoBack is false", () => {
      const store = useScrollStore.getState();

      store.registerView({ id: "view-0", type: "full" });
      store.registerView({
        id: "controlled-view",
        type: "controlled",
        allowGoBack: false,
      });
      store.registerView({ id: "view-2", type: "full" });

      store.goToView(1);
      store.endTransition();
      store.resetNavigationCooldown();

      const backIntention: UserIntention = {
        type: "navigate",
        direction: "up",
        strength: 1,
        origin: "wheel",
      };

      expect(store.processIntention(backIntention)).toBe(false);
      expect(useScrollStore.getState().activeIndex).toBe(1);
    });

    it("should allow going back when allowGoBack is true", () => {
      const store = useScrollStore.getState();

      store.registerView({ id: "view-0", type: "full" });
      store.registerView({
        id: "controlled-view",
        type: "controlled",
        allowGoBack: true,
      });

      store.goToView(1);
      store.endTransition();
      store.resetNavigationCooldown();

      const backIntention: UserIntention = {
        type: "navigate",
        direction: "up",
        strength: 1,
        origin: "wheel",
      };

      expect(store.processIntention(backIntention)).toBe(true);
      expect(useScrollStore.getState().activeIndex).toBe(0);
    });
  });

  // ------------------------------------------
  // Test 7: Global Lock
  // ------------------------------------------
  describe("Global Lock", () => {
    it("should block all navigation when globally locked", () => {
      const store = useScrollStore.getState();

      store.registerView({ id: "view-0", type: "full" });
      store.registerView({ id: "view-1", type: "full" });

      store.setGlobalLock(true);

      const intention: UserIntention = {
        type: "navigate",
        direction: "down",
        strength: 1,
        origin: "wheel",
      };

      store.resetNavigationCooldown();
      expect(store.processIntention(intention)).toBe(false);
      expect(useScrollStore.getState().activeIndex).toBe(0);

      store.setGlobalLock(false);
      store.resetNavigationCooldown();
      expect(store.processIntention(intention)).toBe(true);
    });
  });

  // ------------------------------------------
  // Test 8: View-level Explicit Lock
  // ------------------------------------------
  describe("View-level Explicit Lock", () => {
    it("should block navigation when view is explicitly locked", () => {
      const store = useScrollStore.getState();

      store.registerView({ id: "view-0", type: "full" });
      store.registerView({ id: "view-1", type: "full" });
      store.registerView({ id: "view-2", type: "full" });

      store.goToView(1);
      store.endTransition();
      store.resetNavigationCooldown();

      store.setViewExplicitLock("view-1", "locked");

      const backIntention: UserIntention = {
        type: "navigate",
        direction: "up",
        strength: 1,
        origin: "wheel",
      };

      expect(store.processIntention(backIntention)).toBe(false);

      store.setViewExplicitLock("view-1", null);
      store.resetNavigationCooldown();
      expect(store.processIntention(backIntention)).toBe(true);
    });
  });

  // ------------------------------------------
  // Test 9: Selectors
  // ------------------------------------------
  describe("Selectors", () => {
    it("selectCanNavigateNext should work correctly", () => {
      const store = useScrollStore.getState();

      store.registerView({ id: "view-0", type: "full" });
      store.registerView({ id: "view-1", type: "full" });

      let state = useScrollStore.getState();
      expect(selectCanNavigateNext(state)).toBe(true);
      expect(selectCanNavigatePrevious(state)).toBe(false);

      store.goToView(1);
      store.endTransition();

      state = useScrollStore.getState();
      expect(selectCanNavigateNext(state)).toBe(false);
      expect(selectCanNavigatePrevious(state)).toBe(true);
    });

    it("selectCanNavigatePrevious should work with infiniteScroll", () => {
      const store = useScrollStore.getState();

      store.setInfiniteScrollEnabled(true);
      store.registerView({ id: "view-0", type: "full" });
      store.registerView({ id: "view-1", type: "full" });

      let state = useScrollStore.getState();
      expect(selectCanNavigatePrevious(state)).toBe(true);
      expect(selectCanNavigateNext(state)).toBe(true);

      store.goToView(1);
      store.endTransition();

      state = useScrollStore.getState();
      expect(selectCanNavigatePrevious(state)).toBe(true);
      expect(selectCanNavigateNext(state)).toBe(true);
    });
  });

  // ------------------------------------------
  // Test 10: Navigation Cooldown
  // ------------------------------------------
  describe("Navigation Cooldown", () => {
    it("should prevent rapid navigation", () => {
      const store = useScrollStore.getState();

      store.registerView({ id: "view-0", type: "full" });
      store.registerView({ id: "view-1", type: "full" });
      store.registerView({ id: "view-2", type: "full" });

      store.goToView(1);
      expect(useScrollStore.getState().activeIndex).toBe(1);

      // Immediate second navigation should be blocked
      store.goToView(2);
      expect(useScrollStore.getState().activeIndex).toBe(1);

      // After reset, should work
      store.endTransition();
      store.resetNavigationCooldown();
      store.goToView(2);
      expect(useScrollStore.getState().activeIndex).toBe(2);
    });
  });
});
