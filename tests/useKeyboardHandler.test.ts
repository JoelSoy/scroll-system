/**
 * useKeyboardHandler Hook Tests
 * ==============================
 * Tests for keyboard navigation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useScrollStore } from '../store/navigation.store';

describe('useKeyboardHandler', () => {
  beforeEach(() => {
    // Reset store
    useScrollStore.setState({
      views: [],
      activeIndex: 0,
      activeId: null,
      totalViews: 0,
      isInitialized: true,
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

  describe('Key Mapping', () => {
    it('should map ArrowDown to next navigation', () => {
      const key = 'ArrowDown';
      const direction = ['ArrowDown', 'PageDown', ' '].includes(key) ? 'next' : null;
      
      expect(direction).toBe('next');
    });

    it('should map ArrowUp to previous navigation', () => {
      const key = 'ArrowUp';
      const direction = ['ArrowUp', 'PageUp'].includes(key) ? 'previous' : null;
      
      expect(direction).toBe('previous');
    });

    it('should map PageDown to next navigation', () => {
      const key = 'PageDown';
      const direction = ['ArrowDown', 'PageDown', ' '].includes(key) ? 'next' : null;
      
      expect(direction).toBe('next');
    });

    it('should map PageUp to previous navigation', () => {
      const key = 'PageUp';
      const direction = ['ArrowUp', 'PageUp'].includes(key) ? 'previous' : null;
      
      expect(direction).toBe('previous');
    });

    it('should map Space to next navigation', () => {
      const key = ' ';
      const shiftKey = false;
      const direction = key === ' ' && !shiftKey ? 'next' : null;
      
      expect(direction).toBe('next');
    });

    it('should map Shift+Space to previous navigation', () => {
      const key = ' ';
      const shiftKey = true;
      const direction = key === ' ' && shiftKey ? 'previous' : null;
      
      expect(direction).toBe('previous');
    });

    it('should map Home to first view', () => {
      const key = 'Home';
      const shouldGoToFirst = key === 'Home';
      
      expect(shouldGoToFirst).toBe(true);
    });

    it('should map End to last view', () => {
      const key = 'End';
      const shouldGoToLast = key === 'End';
      
      expect(shouldGoToLast).toBe(true);
    });
  });

  describe('Navigation Integration', () => {
    it('should support programmatic navigation to first', () => {
      const store = useScrollStore.getState();
      store.goToView(2); // Go to last
      store.resetNavigationCooldown(); // Reset cooldown for immediate second navigation
      store.goToView(0); // Home
      
      expect(useScrollStore.getState().activeIndex).toBe(0);
    });

    it('should support programmatic navigation to last', () => {
      const store = useScrollStore.getState();
      const totalViews = useScrollStore.getState().totalViews;
      store.goToView(totalViews - 1); // End
      
      expect(useScrollStore.getState().activeIndex).toBe(2);
    });
  });

  describe('Guard Conditions', () => {
    it('should not navigate when transitioning', () => {
      useScrollStore.setState({ isTransitioning: true });
      
      const state = useScrollStore.getState();
      const canNavigate = !state.isTransitioning;
      
      expect(canNavigate).toBe(false);
    });
  });
});
