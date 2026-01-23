/**
 * Tests for useGlobalProgress hook
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGlobalProgress } from "../hooks/useGlobalProgress";
import { useScrollStore } from "../store";

describe("useGlobalProgress", () => {
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

  it("should return initial progress of 0", () => {
    const { result } = renderHook(() => useGlobalProgress());
    
    expect(result.current.progress).toBe(0);
    expect(result.current.percentage).toBe(0);
  });

  it("should return correct activeIndex", () => {
    useScrollStore.setState({ activeIndex: 2 });
    
    const { result } = renderHook(() => useGlobalProgress());
    
    expect(result.current.activeIndex).toBe(2);
  });

  it("should return correct totalViews", () => {
    useScrollStore.setState({ totalViews: 5 });
    
    const { result } = renderHook(() => useGlobalProgress());
    
    expect(result.current.totalViews).toBe(5);
  });

  it("should calculate percentage correctly", () => {
    useScrollStore.setState({ globalProgress: 0.75 });
    
    const { result } = renderHook(() => useGlobalProgress());
    
    expect(result.current.percentage).toBe(75);
  });

  it("should call onProgress callback when progress changes", () => {
    const onProgress = vi.fn();
    
    renderHook(() => useGlobalProgress({ onProgress }));
    
    act(() => {
      useScrollStore.setState({ globalProgress: 0.5 });
    });
    
    // Callback should be called
    expect(onProgress).toHaveBeenCalled();
  });
});
