/**
 * Navigation Store Unit Tests
 * ============================
 * Tests for the core Zustand store and state machine logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useScrollStore } from '../store/navigation.store';

describe('Navigation Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
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
    useScrollStore.getState().resetNavigationCooldown();
  });

  describe('View Registration', () => {
    it('should register a new view', () => {
      const store = useScrollStore.getState();
      
      store.registerView({ id: 'hero', type: 'full' });
      
      const state = useScrollStore.getState();
      expect(state.views).toHaveLength(1);
      expect(state.views[0].id).toBe('hero');
      expect(state.views[0].type).toBe('full');
      expect(state.totalViews).toBe(1);
    });

    it('should not register duplicate view IDs', () => {
      const store = useScrollStore.getState();
      
      store.registerView({ id: 'hero', type: 'full' });
      store.registerView({ id: 'hero', type: 'full' }); // Duplicate
      
      const state = useScrollStore.getState();
      expect(state.views).toHaveLength(1);
    });

    it('should register multiple views in order', () => {
      const store = useScrollStore.getState();
      
      store.registerView({ id: 'hero', type: 'full' });
      store.registerView({ id: 'about', type: 'scroll-locked', scrollDirection: 'vertical' });
      store.registerView({ id: 'contact', type: 'controlled' });
      
      const state = useScrollStore.getState();
      expect(state.views).toHaveLength(3);
      expect(state.views[0].index).toBe(0);
      expect(state.views[1].index).toBe(1);
      expect(state.views[2].index).toBe(2);
    });

    it('should unregister a view', () => {
      const store = useScrollStore.getState();
      
      store.registerView({ id: 'hero', type: 'full' });
      store.registerView({ id: 'about', type: 'full' });
      store.unregisterView('hero');
      
      const state = useScrollStore.getState();
      expect(state.views).toHaveLength(1);
      expect(state.views[0].id).toBe('about');
    });
  });

  describe('Initialization', () => {
    it('should initialize with first view as active', () => {
      const store = useScrollStore.getState();
      
      store.registerView({ id: 'hero', type: 'full' });
      store.registerView({ id: 'about', type: 'full' });
      store.initialize();
      
      const state = useScrollStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.activeIndex).toBe(0);
      expect(state.activeId).toBe('hero');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      const store = useScrollStore.getState();
      store.registerView({ id: 'hero', type: 'full' });
      store.registerView({ id: 'about', type: 'full' });
      store.registerView({ id: 'contact', type: 'full' });
      store.initialize();
      store.resetNavigationCooldown();
    });

    it('should navigate to next view', () => {
      const store = useScrollStore.getState();
      
      store.goToNext();
      
      const state = useScrollStore.getState();
      expect(state.activeIndex).toBe(1);
      expect(state.activeId).toBe('about');
    });

    it('should navigate to previous view', () => {
      const store = useScrollStore.getState();
      
      store.goToNext(); // Go to index 1
      store.resetNavigationCooldown();
      store.goToPrevious(); // Back to index 0
      
      const state = useScrollStore.getState();
      expect(state.activeIndex).toBe(0);
      expect(state.activeId).toBe('hero');
    });

    it('should not go below index 0', () => {
      const store = useScrollStore.getState();
      
      store.goToPrevious();
      
      const state = useScrollStore.getState();
      expect(state.activeIndex).toBe(0);
    });

    it('should not go above last index', () => {
      const store = useScrollStore.getState();
      
      store.goToNext();
      store.resetNavigationCooldown();
      store.goToNext();
      store.resetNavigationCooldown();
      store.goToNext(); // Try to go beyond last
      
      const state = useScrollStore.getState();
      expect(state.activeIndex).toBe(2); // Should stay at last
    });

    it('should navigate to specific view by index', () => {
      const store = useScrollStore.getState();
      
      store.goToView(2);
      
      const state = useScrollStore.getState();
      expect(state.activeIndex).toBe(2);
      expect(state.activeId).toBe('contact');
    });

    it('should navigate to specific view by ID', () => {
      const store = useScrollStore.getState();
      
      store.goToView('contact');
      
      const state = useScrollStore.getState();
      expect(state.activeIndex).toBe(2);
      expect(state.activeId).toBe('contact');
    });
  });

  describe('State Machine - Locking', () => {
    it('should lock navigation when scroll-locked view has internal scroll', () => {
      const store = useScrollStore.getState();
      
      store.registerView({ 
        id: 'article', 
        type: 'scroll-locked',
        scrollDirection: 'vertical',
        scrollEndThreshold: 0.99
      });
      store.initialize();
      
      // Simulate metrics update showing content overflows
      store.updateViewMetrics('article', {
        scrollTop: 0,
        scrollHeight: 2000,
        clientHeight: 800,
      });
      
      const state = useScrollStore.getState();
      const view = state.views.find(v => v.id === 'article');
      
      expect(view?.capability).toBe('internal');
      expect(view?.navigation).toBe('locked');
    });

    it('should unlock when scrolled to bottom', () => {
      const store = useScrollStore.getState();
      
      store.registerView({ 
        id: 'article', 
        type: 'scroll-locked',
        scrollDirection: 'vertical',
        scrollEndThreshold: 0.99
      });
      store.initialize();
      
      // Simulate scrolled to bottom
      store.updateViewMetrics('article', {
        scrollTop: 1200, // Near bottom
        scrollHeight: 2000,
        clientHeight: 800,
      });
      
      const state = useScrollStore.getState();
      const view = state.views.find(v => v.id === 'article');
      
      expect(view?.progress).toBeGreaterThanOrEqual(0.99);
      expect(view?.navigation).toBe('unlocked');
    });

    it('should respect explicit lock on controlled view', () => {
      const store = useScrollStore.getState();
      
      store.registerView({ 
        id: 'terms', 
        type: 'controlled',
      });
      store.initialize();
      
      // Set explicit lock
      store.setViewExplicitLock('terms', 'locked');
      
      const state = useScrollStore.getState();
      const view = state.views.find(v => v.id === 'terms');
      
      expect(view?.navigation).toBe('locked');
    });
  });

  describe('Global Lock', () => {
    it('should set global lock', () => {
      const store = useScrollStore.getState();
      
      store.setGlobalLock(true);
      
      expect(useScrollStore.getState().isGlobalLocked).toBe(true);
    });

    it('should release global lock', () => {
      const store = useScrollStore.getState();
      
      store.setGlobalLock(true);
      store.setGlobalLock(false);
      
      expect(useScrollStore.getState().isGlobalLocked).toBe(false);
    });
  });

  describe('Dragging State', () => {
    it('should set dragging state', () => {
      const store = useScrollStore.getState();
      
      store.setDragging(true);
      
      expect(useScrollStore.getState().isDragging).toBe(true);
    });

    it('should clear dragging state', () => {
      const store = useScrollStore.getState();
      
      store.setDragging(true);
      store.setDragging(false);
      
      expect(useScrollStore.getState().isDragging).toBe(false);
    });
  });

  describe('User Intention Processing', () => {
    beforeEach(() => {
      const store = useScrollStore.getState();
      store.registerView({ id: 'hero', type: 'full' });
      store.registerView({ id: 'about', type: 'full' });
      store.initialize();
      store.resetNavigationCooldown();
    });

    it('should process navigate intention to go next', () => {
      const store = useScrollStore.getState();
      
      store.processIntention({
        type: 'navigate',
        direction: 'down',
        strength: 1,
        origin: 'wheel',
      });
      
      // Wait for transition to settle (store uses async in some cases)
      const state = useScrollStore.getState();
      expect(state.activeIndex).toBe(1);
    });

    it('should process navigate intention to go previous', () => {
      const store = useScrollStore.getState();
      
      // First go to second view
      store.goToView(1);
      store.endTransition(); // Complete the transition
      store.resetNavigationCooldown();
      
      store.processIntention({
        type: 'navigate',
        direction: 'up',
        strength: 1,
        origin: 'touch',
      });
      
      const state = useScrollStore.getState();
      expect(state.activeIndex).toBe(0);
    });

    it('should ignore navigate intention when locked', () => {
      const store = useScrollStore.getState();
      
      // Lock view
      store.setViewExplicitLock('hero', 'locked');
      
      store.processIntention({
        type: 'navigate',
        direction: 'down',
        strength: 1,
        origin: 'wheel',
      });
      
      const state = useScrollStore.getState();
      expect(state.activeIndex).toBe(0); // Should not move
    });
  });
});
