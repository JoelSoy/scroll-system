/**
 * Tests for useSnapPoints hook
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSnapPoints, createSnapPoints } from "../hooks/useSnapPoints";
import { useScrollStore } from "../store";

describe("useSnapPoints", () => {
  const mockSnapPoints = [
    { id: "intro", position: 0 },
    { id: "features", position: 0.33 },
    { id: "pricing", position: 0.66 },
    { id: "cta", position: 1 },
  ];

  beforeEach(() => {
    useScrollStore.setState({
      views: [
        { 
          id: "landing", 
          index: 0, 
          type: "scroll-locked", 
          isActive: true, 
          isPreloaded: true, 
          capability: "internal", 
          navigation: "locked", 
          explicitLock: null, 
          progress: 0, 
          metrics: { scrollHeight: 1000, clientHeight: 500, scrollTop: 0 }, 
          config: { id: "landing", type: "scroll-locked", scrollDirection: "vertical" }, 
          activeSnapPointId: null 
        },
      ],
      activeIndex: 0,
      totalViews: 1,
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

  it("should return activePoint as first snap point initially", () => {
    const { result } = renderHook(() => 
      useSnapPoints({ viewId: "landing", points: mockSnapPoints })
    );
    
    expect(result.current.activePoint?.id).toBe("intro");
    expect(result.current.activeIndex).toBe(0);
  });

  it("should return all points with isActive state", () => {
    const { result } = renderHook(() => 
      useSnapPoints({ viewId: "landing", points: mockSnapPoints })
    );
    
    expect(result.current.points).toHaveLength(4);
    expect(result.current.points[0].isActive).toBe(true);
    expect(result.current.points[1].isActive).toBe(false);
  });

  it("should update active point based on progress", () => {
    // Set progress to 0.33 (features)
    act(() => {
      useScrollStore.setState({
        views: [{
          ...useScrollStore.getState().views[0],
          progress: 0.33,
        }],
      });
    });
    
    const { result } = renderHook(() => 
      useSnapPoints({ viewId: "landing", points: mockSnapPoints })
    );
    
    expect(result.current.activePoint?.id).toBe("features");
  });

  it("should call onReach callback when snap point is reached", () => {
    const onReach = vi.fn();
    const pointsWithCallback = [
      { id: "intro", position: 0, onReach },
      { id: "features", position: 0.5 },
    ];
    
    renderHook(() => 
      useSnapPoints({ viewId: "landing", points: pointsWithCallback })
    );
    
    // onReach should be called for initial active point
    expect(onReach).toHaveBeenCalled();
  });

  it("should return progress value", () => {
    const { result } = renderHook(() => 
      useSnapPoints({ viewId: "landing", points: mockSnapPoints })
    );
    
    expect(result.current.progress).toBe(0);
  });
});

describe("createSnapPoints utility", () => {
  it("should create snap points from positions array", () => {
    const positions = [0, 0.25, 0.5, 0.75, 1];
    const points = createSnapPoints(positions);
    
    expect(points).toHaveLength(5);
    expect(points[0].id).toBe("snap-0");
    expect(points[0].position).toBe(0);
    expect(points[2].position).toBe(0.5);
  });

  it("should use custom prefix", () => {
    const positions = [0, 0.5, 1];
    const points = createSnapPoints(positions, { prefix: "section" });
    
    expect(points[0].id).toBe("section-0");
    expect(points[1].id).toBe("section-1");
  });

  it("should use custom labels", () => {
    const positions = [0, 0.5, 1];
    const labels = ["Start", "Middle", "End"];
    const points = createSnapPoints(positions, { labels });
    
    expect(points[0].label).toBe("Start");
    expect(points[1].label).toBe("Middle");
    expect(points[2].label).toBe("End");
  });
});
