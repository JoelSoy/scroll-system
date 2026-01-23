/**
 * useScrollLock Hook
 * ========================================
 * Programmatic control for locking/unlocking scroll navigation.
 * Useful for modals, forms, or any scenario requiring temporary navigation prevention.
 */

import { useCallback } from "react";
import { useScrollStore } from "../store";

export interface ScrollLockState {
  /** Whether global navigation is currently locked */
  isLocked: boolean;
  /** Lock global navigation */
  lock: () => void;
  /** Unlock global navigation */
  unlock: () => void;
  /** Toggle lock state */
  toggle: () => void;
  /** Lock a specific view by ID */
  lockView: (viewId: string) => void;
  /** Unlock a specific view by ID */
  unlockView: (viewId: string) => void;
}

/**
 * Hook for programmatic control of scroll navigation locking.
 * 
 * @example
 * ```tsx
 * const { lock, unlock, isLocked } = useScrollLock();
 * 
 * const openModal = () => {
 *   lock();
 *   setModalOpen(true);
 * };
 * 
 * const closeModal = () => {
 *   unlock();
 *   setModalOpen(false);
 * };
 * ```
 */
export function useScrollLock(): ScrollLockState {
  const isLocked = useScrollStore((s) => s.isGlobalLocked);
  const setGlobalLock = useScrollStore((s) => s.setGlobalLock);
  const setViewExplicitLock = useScrollStore((s) => s.setViewExplicitLock);
  
  const lock = useCallback(() => {
    setGlobalLock(true);
  }, [setGlobalLock]);
  
  const unlock = useCallback(() => {
    setGlobalLock(false);
  }, [setGlobalLock]);
  
  const toggle = useCallback(() => {
    setGlobalLock(!isLocked);
  }, [setGlobalLock, isLocked]);
  
  const lockView = useCallback((viewId: string) => {
    setViewExplicitLock(viewId, "locked");
  }, [setViewExplicitLock]);
  
  const unlockView = useCallback((viewId: string) => {
    setViewExplicitLock(viewId, "unlocked");
  }, [setViewExplicitLock]);
  
  return {
    isLocked,
    lock,
    unlock,
    toggle,
    lockView,
    unlockView,
  };
}
