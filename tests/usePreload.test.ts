/**
 * Tests for usePreload hook
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePreload } from "../hooks/usePreload";
import { useScrollStore } from "../store";

describe("usePreload", () => {
  beforeEach(() => {
    // Reset store and register some views
    useScrollStore.setState({
      views: [
        { id: "view-0", index: 0, type: "full", isActive: true, isPreloaded: true, capability: "none", navigation: "unlocked", explicitLock: null, progress: 0, metrics: { scrollHeight: 0, clientHeight: 0, scrollTop: 0 }, config: { id: "view-0", type: "full" }, activeSnapPointId: null },
        { id: "view-1", index: 1, type: "full", isActive: false, isPreloaded: true, capability: "none", navigation: "unlocked", explicitLock: null, progress: 0, metrics: { scrollHeight: 0, clientHeight: 0, scrollTop: 0 }, config: { id: "view-1", type: "full" }, activeSnapPointId: null },
        { id: "view-2", index: 2, type: "full", isActive: false, isPreloaded: false, capability: "none", navigation: "unlocked", explicitLock: null, progress: 0, metrics: { scrollHeight: 0, clientHeight: 0, scrollTop: 0 }, config: { id: "view-2", type: "full" }, activeSnapPointId: null },
        { id: "view-3", index: 3, type: "full", isActive: false, isPreloaded: false, capability: "none", navigation: "unlocked", explicitLock: null, progress: 0, metrics: { scrollHeight: 0, clientHeight: 0, scrollTop: 0 }, config: { id: "view-3", type: "full" }, activeSnapPointId: null },
        { id: "view-4", index: 4, type: "full", isActive: false, isPreloaded: false, capability: "none", navigation: "unlocked", explicitLock: null, progress: 0, metrics: { scrollHeight: 0, clientHeight: 0, scrollTop: 0 }, config: { id: "view-4", type: "full" }, activeSnapPointId: null },
      ],
      activeIndex: 0,
      totalViews: 5,
      globalProgress: 0,
      isInitialized: true,
      isTransitioning: false,
      isGlobalLocked: false,
      isDragging: false,
      isAutoScrolling: false,
      isAutoScrollPaused: false,
      infiniteScrollEnabled: false,
    });
  });

  it("should return preloadedViewIds for default config", () => {
    const { result } = renderHook(() => usePreload());
    
    // Default: ahead=1, behind=1, activeIndex=0
    // So should preload view-0 (active) and view-1 (ahead)
    expect(result.current.preloadedViewIds).toContain("view-0");
    expect(result.current.preloadedViewIds).toContain("view-1");
    expect(result.current.preloadedViewIds).not.toContain("view-3");
  });

  it("should preload more views when ahead is increased", () => {
    const { result } = renderHook(() => usePreload({ ahead: 2, behind: 0 }));
    
    // activeIndex=0, ahead=2
    // Should preload view-0, view-1, view-2
    expect(result.current.preloadedViewIds).toContain("view-0");
    expect(result.current.preloadedViewIds).toContain("view-1");
    expect(result.current.preloadedViewIds).toContain("view-2");
  });

  it("shouldPreload() returns true for preloaded views", () => {
    const { result } = renderHook(() => usePreload({ ahead: 1, behind: 1 }));
    
    expect(result.current.shouldPreload("view-0")).toBe(true);
    expect(result.current.shouldPreload("view-1")).toBe(true);
    expect(result.current.shouldPreload("view-4")).toBe(false);
  });

  it("should handle infinite scroll wrapping", () => {
    useScrollStore.setState({ 
      activeIndex: 4, // Last view
      infiniteScrollEnabled: true 
    });
    
    const { result } = renderHook(() => usePreload({ ahead: 1, behind: 1 }));
    
    // Should wrap around to view-0
    expect(result.current.preloadedViewIds).toContain("view-4"); // active
    expect(result.current.preloadedViewIds).toContain("view-3"); // behind
    expect(result.current.preloadedViewIds).toContain("view-0"); // ahead (wrapped)
  });
});
