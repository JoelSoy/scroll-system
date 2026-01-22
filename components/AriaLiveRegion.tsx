/**
 * Scroll System - Aria Live Region
 * ==================================
 * Announces view changes to screen readers.
 */

import React, { useEffect, useState } from "react";
import { useScrollStore } from "../store";

export interface AriaLiveRegionProps {
  /** Custom announcement template. Use {viewIndex} and {viewId} as placeholders */
  template?: string;
  /** Politeness level for announcements */
  politeness?: "polite" | "assertive";
}

/**
 * Invisible component that announces view changes to screen readers.
 * Place inside ScrollContainer.
 */
export function AriaLiveRegion({
  template = "Navigated to section {viewIndex} of {totalViews}",
  politeness = "polite",
}: AriaLiveRegionProps) {
  const [announcement, setAnnouncement] = useState("");
  
  const activeIndex = useScrollStore((s) => s.activeIndex);
  const activeId = useScrollStore((s) => s.activeId);
  const totalViews = useScrollStore((s) => s.totalViews);
  const isTransitioning = useScrollStore((s) => s.isTransitioning);

  useEffect(() => {
    // Announce when transition ends
    if (!isTransitioning && activeId) {
      const message = template
        .replace("{viewIndex}", String(activeIndex + 1))
        .replace("{viewId}", activeId)
        .replace("{totalViews}", String(totalViews));
      
      // Small delay to ensure screen reader picks it up
      const timer = setTimeout(() => {
        setAnnouncement(message);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [activeIndex, activeId, totalViews, isTransitioning, template]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      {announcement}
    </div>
  );
}

export default AriaLiveRegion;
