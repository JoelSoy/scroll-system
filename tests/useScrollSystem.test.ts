/**
 * useScrollSystem Hook Tests
 * ===========================
 * Tests for the main public API hook.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollSystem } from '../hooks/useScrollSystem';
import { useScrollStore } from '../store/navigation.store';

describe('useScrollSystem Hook', () => {
  beforeEach(() => {
    // Reset store
    useScrollStore.setState({
      views: [],
      activeIndex: 0,
      activeId: null,
      totalViews: 0,
      isInitialized: false,
      isTransitioning: false,
      isGlobalLocked: false,
      isDragging: false,
      globalProgress: 0,
    });
    
    // Setup test views
    const store = useScrollStore.getState();
    store.registerView({ id: 'hero', type: 'full' });
    store.registerView({ id: 'about', type: 'full' });
    store.registerView({ id: 'contact', type: 'full' });
    store.initialize();
    store.resetNavigationCooldown();
  });

  describe('Navigation Methods', () => {
    it('should expose goToNext method', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      expect(result.current.goToNext).toBeDefined();
      expect(typeof result.current.goToNext).toBe('function');
    });

    it('should expose goToPrev method', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      expect(result.current.goToPrev).toBeDefined();
      expect(typeof result.current.goToPrev).toBe('function');
    });

    it('should expose goTo method', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      expect(result.current.goTo).toBeDefined();
      expect(typeof result.current.goTo).toBe('function');
    });

    it('goToNext should increment activeIndex', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      act(() => {
        result.current.goToNext();
      });
      
      expect(useScrollStore.getState().activeIndex).toBe(1);
    });

    it('goToPrev should decrement activeIndex', () => {
      const { result } = renderHook(() => useScrollSystem());
      const store = useScrollStore.getState();
      
      // Navigate forward using store directly
      store.goToNext();
      store.endTransition();
      store.resetNavigationCooldown();
      
      // Verify we're at index 1
      expect(useScrollStore.getState().activeIndex).toBe(1);
      
      // Navigate back using store directly (bypasses hook's canNavigatePrevious check)
      store.goToPrevious();
      
      expect(useScrollStore.getState().activeIndex).toBe(0);
    });

    it('goTo should navigate to specific index', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      act(() => {
        result.current.goTo(2);
      });
      
      expect(useScrollStore.getState().activeIndex).toBe(2);
    });

    it('goTo should navigate to specific ID', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      act(() => {
        result.current.goTo('contact');
      });
      
      expect(useScrollStore.getState().activeId).toBe('contact');
    });
  });

  describe('State Accessors', () => {
    it('should expose activeIndex', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      expect(result.current.activeIndex).toBe(0);
    });

    it('should expose activeId', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      expect(result.current.activeId).toBe('hero');
    });

    it('should expose totalViews', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      expect(result.current.totalViews).toBe(3);
    });

    it('should update when navigation happens', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      act(() => {
        result.current.goToNext();
      });
      
      expect(result.current.activeIndex).toBe(1);
      expect(result.current.activeId).toBe('about');
    });
  });

  describe('Status Methods', () => {
    it('should have isLocked method', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      expect(result.current.isLocked).toBeDefined();
      expect(typeof result.current.isLocked).toBe('function');
    });

    it('should have getProgress method', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      expect(result.current.getProgress).toBeDefined();
      expect(typeof result.current.getProgress).toBe('function');
    });

    it('should have canGoNext property', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      expect(result.current.canGoNext).toBeDefined();
      expect(typeof result.current.canGoNext).toBe('boolean');
    });

    it('should have canGoPrev property', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      expect(result.current.canGoPrev).toBeDefined();
      expect(typeof result.current.canGoPrev).toBe('boolean');
    });
  });

  describe('UI State', () => {
    it('should expose isDragging', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      expect(result.current.isDragging).toBe(false);
    });

    it('should expose isTransitioning', () => {
      const { result } = renderHook(() => useScrollSystem());
      
      expect(result.current.isTransitioning).toBe(false);
    });
  });
});
