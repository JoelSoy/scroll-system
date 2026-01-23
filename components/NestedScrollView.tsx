/**
 * NestedScrollView Component
 * ========================================
 * Enables nested scroll areas within views.
 * Handles scroll direction isolation to prevent interference with main navigation.
 */

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useScrollStore } from "../store";
import { useViewRegistration } from "../hooks/useViewRegistration";
import type { NestedScrollViewProps } from "../types";

/**
 * A view component that supports nested scrolling perpendicular to main navigation.
 * Perfect for horizontal carousels within a vertical scroll system.
 * 
 * @example
 * ```tsx
 * <NestedScrollView 
 *   id="gallery" 
 *   nestedDirection="horizontal"
 *   enableSnap={true}
 *   onItemChange={(index) => console.log('Active item:', index)}
 * >
 *   <div className="flex">
 *     <div className="w-screen flex-shrink-0">Item 1</div>
 *     <div className="w-screen flex-shrink-0">Item 2</div>
 *     <div className="w-screen flex-shrink-0">Item 3</div>
 *   </div>
 * </NestedScrollView>
 * ```
 */
export function NestedScrollView({
  id,
  children,
  className = "",
  nestedDirection = "horizontal",
  enableSnap = true,
  onItemChange,
  onActivate,
  onDeactivate,
  onEnterStart,
  onEnterEnd,
  onExitStart,
  onExitEnd,
}: NestedScrollViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nestedContainerRef = useRef<HTMLDivElement>(null);
  const [activeNestedIndex, setActiveNestedIndex] = useState(0);
  const [isNestedScrolling, setIsNestedScrolling] = useState(false);
  
  const activeIndex = useScrollStore((s) => s.activeIndex);
  const views = useScrollStore((s) => s.views);
  const setGlobalLock = useScrollStore((s) => s.setGlobalLock);
  
  const view = views.find((v) => v.id === id);
  const isActive = view?.isActive ?? false;
  
  // Register this view
  useViewRegistration({
    config: {
      id,
      type: "nested",
      nestedConfig: {
        direction: nestedDirection,
        enableSnap,
        onItemChange,
      },
    },
    onActivate,
    onDeactivate,
    onEnterStart,
    onEnterEnd,
    onExitStart,
    onExitEnd,
  });
  
  // Handle lifecycle callbacks
  useEffect(() => {
    if (isActive) {
      onActivate?.();
    } else {
      onDeactivate?.();
    }
  }, [isActive, onActivate, onDeactivate]);
  
  // Handle nested scroll
  const handleNestedScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!nestedContainerRef.current) return;
    
    const container = nestedContainerRef.current;
    const scrollPos = nestedDirection === "horizontal" 
      ? container.scrollLeft 
      : container.scrollTop;
    const itemSize = nestedDirection === "horizontal"
      ? container.clientWidth
      : container.clientHeight;
    
    if (itemSize > 0) {
      const newIndex = Math.round(scrollPos / itemSize);
      if (newIndex !== activeNestedIndex) {
        setActiveNestedIndex(newIndex);
        onItemChange?.(newIndex);
      }
    }
  }, [nestedDirection, activeNestedIndex, onItemChange]);
  
  // Touch handling - prevent main scroll when user is scrolling nested content
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Lock main navigation when starting touch on nested scroll
    setIsNestedScrolling(true);
    setGlobalLock(true);
  }, [setGlobalLock]);
  
  const handleTouchEnd = useCallback(() => {
    // Unlock after a short delay to allow snap to complete
    setTimeout(() => {
      setIsNestedScrolling(false);
      setGlobalLock(false);
    }, 100);
  }, [setGlobalLock]);
  
  // Snap to item
  const scrollToItem = useCallback((index: number) => {
    if (!nestedContainerRef.current) return;
    
    const container = nestedContainerRef.current;
    const itemSize = nestedDirection === "horizontal"
      ? container.clientWidth
      : container.clientHeight;
    
    const scrollPos = index * itemSize;
    
    container.scrollTo({
      [nestedDirection === "horizontal" ? "left" : "top"]: scrollPos,
      behavior: "smooth",
    });
  }, [nestedDirection]);
  
  // Scroll container styles for nested scroll
  const nestedScrollStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: nestedDirection === "horizontal" ? "row" : "column",
    overflow: nestedDirection === "horizontal" ? "auto hidden" : "hidden auto",
    scrollSnapType: enableSnap 
      ? `${nestedDirection === "horizontal" ? "x" : "y"} mandatory` 
      : "none",
    scrollBehavior: "smooth",
    WebkitOverflowScrolling: "touch",
    width: "100%",
    height: "100%",
  };
  
  return (
    <div
      ref={containerRef}
      className={`scroll-view nested-scroll-view h-screen w-screen flex-shrink-0 relative ${className}`}
      data-view-id={id}
      data-view-type="nested"
      data-nested-direction={nestedDirection}
      role="region"
      aria-label={`Nested scroll view ${id}`}
      tabIndex={0}
    >
      <div
        ref={nestedContainerRef}
        className="nested-scroll-container"
        style={nestedScrollStyle}
        onScroll={handleNestedScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Helper component for items within NestedScrollView.
 * Ensures proper sizing and snap behavior.
 */
export function NestedScrollItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`nested-scroll-item flex-shrink-0 w-full h-full ${className}`}
      style={{
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
      }}
    >
      {children}
    </div>
  );
}
