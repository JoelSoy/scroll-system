/**
 * Tests for useParallax hook
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useParallax, useActiveParallax } from "../hooks/useParallax";
import { useScrollStore } from "../store";

describe("useParallax", () => {
  beforeEach(() => {
    useScrollStore.setState({
      views: [
        { id: "hero", index: 0, type: "full", isActive: true, isPreloaded: true, capability: "none", navigation: "unlocked", explicitLock: null, progress: 0, metrics: { scrollHeight: 0, clientHeight: 0, scrollTop: 0 }, config: { id: "hero", type: "full" }, activeSnapPointId: null },
        { id: "features", index: 1, type: "full", isActive: false, isPreloaded: true, capability: "none", navigation: "unlocked", explicitLock: null, progress: 0, metrics: { scrollHeight: 0, clientHeight: 0, scrollTop: 0 }, config: { id: "features", type: "full" }, activeSnapPointId: null },
      ],
      activeIndex: 0,
      totalViews: 2,
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

  it("should return transform value of 0 for active view", () => {
    const { result } = renderHook(() => useParallax("hero"));
    
    // Active view at index 0, progress 0 -> transform should be 0
    expect(result.current.transform).toBe(0);
    expect(result.current.progress).toBe(0);
  });

  it("should return style object with transform", () => {
    const { result } = renderHook(() => useParallax("hero", { speed: 0.5 }));
    
    expect(result.current.style).toHaveProperty("transform");
    expect(result.current.style).toHaveProperty("willChange", "transform");
  });

  it("should apply vertical transform by default", () => {
    const { result } = renderHook(() => useParallax("hero"));
    
    expect(result.current.style.transform).toContain("translateY");
  });

  it("should apply horizontal transform when direction is horizontal", () => {
    const { result } = renderHook(() => 
      useParallax("hero", { direction: "horizontal" })
    );
    
    expect(result.current.style.transform).toContain("translateX");
  });

  it("should return empty style for non-existent view", () => {
    const { result } = renderHook(() => useParallax("non-existent"));
    
    expect(result.current.transform).toBe(0);
    expect(result.current.progress).toBe(0);
  });

  it("should apply offset", () => {
    const { result } = renderHook(() => 
      useParallax("hero", { speed: 0, offset: 50 })
    );
    
    // With speed 0 and offset 50, transform should be 50
    expect(result.current.transform).toBe(50);
  });
});

describe("useActiveParallax", () => {
  beforeEach(() => {
    useScrollStore.setState({
      views: [
        { id: "hero", index: 0, type: "full", isActive: true, isPreloaded: true, capability: "internal", navigation: "unlocked", explicitLock: null, progress: 0.5, metrics: { scrollHeight: 1000, clientHeight: 500, scrollTop: 250 }, config: { id: "hero", type: "full" }, activeSnapPointId: null },
      ],
      activeIndex: 0,
      totalViews: 1,
      globalProgress: 0.5,
      isInitialized: true,
      isTransitioning: false,
      isGlobalLocked: false,
      isDragging: false,
      isAutoScrolling: false,
      isAutoScrollPaused: false,
      infiniteScrollEnabled: false,
    });
  });

  it("should return progress based on active view", () => {
    const { result } = renderHook(() => useActiveParallax());
    
    expect(result.current.progress).toBe(0.5);
  });

  it("should return style object", () => {
    const { result } = renderHook(() => useActiveParallax({ speed: 0.5 }));
    
    expect(result.current.style).toHaveProperty("transform");
  });
});
