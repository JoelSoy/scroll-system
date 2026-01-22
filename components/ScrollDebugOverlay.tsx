/**
 * Scroll System - Debug Overlay
 * ===============================
 * Visual debugging component for the scroll system.
 * Shows internal state in real-time for development.
 * 
 * Usage: <ScrollDebugOverlay /> inside ScrollContainer
 */

import React from "react";
import { useScrollStore } from "../store";

interface ScrollDebugOverlayProps {
  /** Position of the overlay (default: "bottom-left") */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Show/hide the overlay (default: true) */
  visible?: boolean;
}

export function ScrollDebugOverlay({
  position = "bottom-left",
  visible = true,
}: ScrollDebugOverlayProps) {
  // Subscribe to all relevant state
  const activeIndex = useScrollStore((s) => s.activeIndex);
  const totalViews = useScrollStore((s) => s.totalViews);
  const isTransitioning = useScrollStore((s) => s.isTransitioning);
  const isGlobalLocked = useScrollStore((s) => s.isGlobalLocked);
  const isInitialized = useScrollStore((s) => s.isInitialized);
  const views = useScrollStore((s) => s.views);
  
  const activeView = views[activeIndex];

  if (!visible) return null;

  // Position classes
  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-9999 font-mono text-xs bg-black/90 text-green-400 p-3 rounded-lg border border-green-500/30 backdrop-blur-sm max-w-xs`}
      style={{ pointerEvents: "none" }}
    >
      <div className="text-green-300 font-bold mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        ScrollSystem Debug
      </div>
      
      {/* Global State */}
      <div className="space-y-1 mb-3">
        <Row label="initialized" value={isInitialized} />
        <Row label="activeIndex" value={`${activeIndex} / ${totalViews - 1}`} />
        <Row label="transitioning" value={isTransitioning} />
        <Row label="globalLocked" value={isGlobalLocked} />
      </div>

      {/* Active View */}
      {activeView && (
        <div className="border-t border-green-500/20 pt-2 mt-2">
          <div className="text-green-300/70 mb-1">Active View</div>
          <Row label="id" value={activeView.id} />
          <Row label="type" value={activeView.type} />
          <Row label="capability" value={activeView.capability} />
          <Row label="navigation" value={activeView.navigation} />
          <Row label="progress" value={`${(activeView.progress * 100).toFixed(0)}%`} />
          {activeView.explicitLock && (
            <Row label="explicitLock" value={activeView.explicitLock} highlight />
          )}
        </div>
      )}

      {/* Metrics */}
      {activeView?.metrics && (
        <div className="border-t border-green-500/20 pt-2 mt-2">
          <div className="text-green-300/70 mb-1">Metrics</div>
          <Row label="scrollHeight" value={activeView.metrics.scrollHeight} />
          <Row label="clientHeight" value={activeView.metrics.clientHeight} />
          <Row label="scrollTop" value={Math.round(activeView.metrics.scrollTop)} />
        </div>
      )}
    </div>
  );
}

// Helper component for rows
function Row({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: string | number | boolean; 
  highlight?: boolean;
}) {
  const displayValue = typeof value === "boolean" 
    ? (value ? "✓" : "✗") 
    : String(value);
  
  const valueColor = typeof value === "boolean"
    ? (value ? "text-green-400" : "text-red-400")
    : highlight 
      ? "text-yellow-400" 
      : "text-white";

  return (
    <div className="flex justify-between gap-4">
      <span className="text-green-500/70">{label}:</span>
      <span className={valueColor}>{displayValue}</span>
    </div>
  );
}

export default ScrollDebugOverlay;
