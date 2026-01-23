/**
 * Tests for useAutoScroll hook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { useScrollStore } from "../store";

describe("useAutoScroll", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    
    // Reset store
    useScrollStore.setState({
      views: [
        { id: "view-0", index: 0, type: "full", isActive: true, isPreloaded: true, capability: "none", navigation: "unlocked", explicitLock: null, progress: 0, metrics: { scrollHeight: 0, clientHeight: 0, scrollTop: 0 }, config: { id: "view-0", type: "full" }, activeSnapPointId: null },
        { id: "view-1", index: 1, type: "full", isActive: false, isPreloaded: true, capability: "none", navigation: "unlocked", explicitLock: null, progress: 0, metrics: { scrollHeight: 0, clientHeight: 0, scrollTop: 0 }, config: { id: "view-1", type: "full" }, activeSnapPointId: null },
        { id: "view-2", index: 2, type: "full", isActive: false, isPreloaded: false, capability: "none", navigation: "unlocked", explicitLock: null, progress: 0, metrics: { scrollHeight: 0, clientHeight: 0, scrollTop: 0 }, config: { id: "view-2", type: "full" }, activeSnapPointId: null },
      ],
      activeIndex: 0,
      totalViews: 3,
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not be playing when disabled", () => {
    const { result } = renderHook(() => 
      useAutoScroll({ enabled: false, interval: 1000 })
    );
    
    expect(result.current.isPlaying).toBe(false);
  });

  it("should be playing when enabled", () => {
    const { result } = renderHook(() => 
      useAutoScroll({ enabled: true, interval: 1000 })
    );
    
    expect(result.current.isPlaying).toBe(true);
  });

  it("should pause when pause() is called", () => {
    const { result } = renderHook(() => 
      useAutoScroll({ enabled: true, interval: 1000 })
    );
    
    expect(result.current.isPlaying).toBe(true);
    
    act(() => {
      result.current.pause();
    });
    
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isPaused).toBe(true);
  });

  it("should resume when resume() is called", () => {
    const { result } = renderHook(() => 
      useAutoScroll({ enabled: true, interval: 1000 })
    );
    
    act(() => {
      result.current.pause();
    });
    
    expect(result.current.isPaused).toBe(true);
    
    act(() => {
      result.current.resume();
    });
    
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isPlaying).toBe(true);
  });

  it("should toggle play/pause", () => {
    const { result } = renderHook(() => 
      useAutoScroll({ enabled: true, interval: 1000 })
    );
    
    expect(result.current.isPlaying).toBe(true);
    
    act(() => {
      result.current.toggle();
    });
    
    expect(result.current.isPlaying).toBe(false);
    
    act(() => {
      result.current.toggle();
    });
    
    expect(result.current.isPlaying).toBe(true);
  });

  it("should set isAutoScrolling in store when enabled", () => {
    renderHook(() => 
      useAutoScroll({ enabled: true, interval: 1000 })
    );
    
    expect(useScrollStore.getState().isAutoScrolling).toBe(true);
  });

  it("should pause on dragging when pauseOnInteraction is true", () => {
    const { result } = renderHook(() => 
      useAutoScroll({ enabled: true, interval: 1000, pauseOnInteraction: true })
    );
    
    expect(result.current.isPlaying).toBe(true);
    
    act(() => {
      useScrollStore.setState({ isDragging: true });
    });
    
    expect(result.current.isPaused).toBe(true);
  });
});
