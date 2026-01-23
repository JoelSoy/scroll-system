/**
 * Tests for useScrollLock hook
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrollLock } from "../hooks/useScrollLock";
import { useScrollStore } from "../store";

describe("useScrollLock", () => {
  beforeEach(() => {
    // Reset store before each test
    useScrollStore.setState({
      views: [],
      activeIndex: 0,
      totalViews: 0,
      globalProgress: 0,
      isInitialized: false,
      isTransitioning: false,
      isGlobalLocked: false,
      isDragging: false,
      isAutoScrolling: false,
      isAutoScrollPaused: false,
      infiniteScrollEnabled: false,
    });
  });

  it("should return initial isLocked as false", () => {
    const { result } = renderHook(() => useScrollLock());
    
    expect(result.current.isLocked).toBe(false);
  });

  it("should lock navigation when lock() is called", () => {
    const { result } = renderHook(() => useScrollLock());
    
    act(() => {
      result.current.lock();
    });
    
    expect(result.current.isLocked).toBe(true);
    expect(useScrollStore.getState().isGlobalLocked).toBe(true);
  });

  it("should unlock navigation when unlock() is called", () => {
    useScrollStore.setState({ isGlobalLocked: true });
    
    const { result } = renderHook(() => useScrollLock());
    
    act(() => {
      result.current.unlock();
    });
    
    expect(result.current.isLocked).toBe(false);
    expect(useScrollStore.getState().isGlobalLocked).toBe(false);
  });

  it("should toggle lock state when toggle() is called", () => {
    const { result } = renderHook(() => useScrollLock());
    
    expect(result.current.isLocked).toBe(false);
    
    act(() => {
      result.current.toggle();
    });
    
    expect(result.current.isLocked).toBe(true);
    
    act(() => {
      result.current.toggle();
    });
    
    expect(result.current.isLocked).toBe(false);
  });

  it("should lock specific view when lockView() is called", () => {
    // Register a view first
    act(() => {
      useScrollStore.getState().registerView({ id: "test-view", type: "full" });
    });
    
    const { result } = renderHook(() => useScrollLock());
    
    act(() => {
      result.current.lockView("test-view");
    });
    
    const view = useScrollStore.getState().views.find(v => v.id === "test-view");
    expect(view?.explicitLock).toBe("locked");
  });

  it("should unlock specific view when unlockView() is called", () => {
    // Register a view first
    act(() => {
      useScrollStore.getState().registerView({ id: "test-view", type: "full" });
      useScrollStore.getState().setViewExplicitLock("test-view", "locked");
    });
    
    const { result } = renderHook(() => useScrollLock());
    
    act(() => {
      result.current.unlockView("test-view");
    });
    
    const view = useScrollStore.getState().views.find(v => v.id === "test-view");
    expect(view?.explicitLock).toBe("unlocked");
  });
});
