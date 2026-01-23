/**
 * Tests for useInfiniteScroll hook
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useScrollStore } from "../store";

describe("useInfiniteScroll", () => {
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

  it("should return initial isEnabled as false", () => {
    const { result } = renderHook(() => useInfiniteScroll(false));
    
    expect(result.current.isEnabled).toBe(false);
  });

  it("should enable infinite scroll when passed true", () => {
    const { result } = renderHook(() => useInfiniteScroll(true));
    
    expect(useScrollStore.getState().infiniteScrollEnabled).toBe(true);
    expect(result.current.isEnabled).toBe(true);
  });

  it("should enable infinite scroll when passed config with enabled: true", () => {
    const { result } = renderHook(() => 
      useInfiniteScroll({ enabled: true, loopDirection: "both" })
    );
    
    expect(result.current.isEnabled).toBe(true);
  });

  it("should enable on calling enable()", () => {
    const { result } = renderHook(() => useInfiniteScroll(false));
    
    expect(result.current.isEnabled).toBe(false);
    
    act(() => {
      result.current.enable();
    });
    
    expect(result.current.isEnabled).toBe(true);
  });

  it("should disable on calling disable()", () => {
    const { result } = renderHook(() => useInfiniteScroll(true));
    
    expect(result.current.isEnabled).toBe(true);
    
    act(() => {
      result.current.disable();
    });
    
    expect(result.current.isEnabled).toBe(false);
  });

  it("should toggle on calling toggle()", () => {
    const { result } = renderHook(() => useInfiniteScroll(false));
    
    expect(result.current.isEnabled).toBe(false);
    
    act(() => {
      result.current.toggle();
    });
    
    expect(result.current.isEnabled).toBe(true);
    
    act(() => {
      result.current.toggle();
    });
    
    expect(result.current.isEnabled).toBe(false);
  });

  it("should indicate canLoopForward when at last view", () => {
    useScrollStore.setState({ 
      activeIndex: 2, 
      totalViews: 3,
      infiniteScrollEnabled: true 
    });
    
    const { result } = renderHook(() => 
      useInfiniteScroll({ enabled: true, loopDirection: "forward" })
    );
    
    expect(result.current.canLoopForward).toBe(true);
    expect(result.current.canLoopBackward).toBe(false);
  });

  it("should indicate canLoopBackward when at first view", () => {
    useScrollStore.setState({ 
      activeIndex: 0, 
      totalViews: 3,
      infiniteScrollEnabled: true 
    });
    
    const { result } = renderHook(() => 
      useInfiniteScroll({ enabled: true, loopDirection: "backward" })
    );
    
    expect(result.current.canLoopForward).toBe(false);
    expect(result.current.canLoopBackward).toBe(true);
  });
});
