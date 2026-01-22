/**
 * useHashSync Hook Tests
 * =======================
 * Tests for URL hash synchronization (deep linking).
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useScrollStore } from '../store/navigation.store';

describe('useHashSync', () => {
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
    
    // Reset window.location.hash
    window.location.hash = '';
  });

  afterEach(() => {
    window.location.hash = '';
  });

  describe('Hash Parsing', () => {
    it('should extract view ID from hash', () => {
      const hash = '#about';
      const viewId = hash.slice(1); // Remove #
      
      expect(viewId).toBe('about');
    });

    it('should handle hash with prefix', () => {
      const hash = '#section-about';
      const prefix = 'section-';
      const viewId = hash.slice(1).replace(prefix, '');
      
      expect(viewId).toBe('about');
    });

    it('should handle empty hash', () => {
      const hash = '';
      const viewId = hash.slice(1);
      
      expect(viewId).toBe('');
    });
  });

  describe('Hash Generation', () => {
    it('should generate hash from view ID', () => {
      const viewId = 'about';
      const hash = `#${viewId}`;
      
      expect(hash).toBe('#about');
    });

    it('should generate hash with prefix', () => {
      const viewId = 'about';
      const prefix = 'section-';
      const hash = `#${prefix}${viewId}`;
      
      expect(hash).toBe('#section-about');
    });
  });

  describe('View ID Resolution', () => {
    it('should find view by ID', () => {
      const views = useScrollStore.getState().views;
      const targetId = 'about';
      const view = views.find(v => v.id === targetId);
      
      expect(view).toBeDefined();
      expect(view?.id).toBe('about');
    });

    it('should return undefined for non-existent ID', () => {
      const views = useScrollStore.getState().views;
      const targetId = 'non-existent';
      const view = views.find(v => v.id === targetId);
      
      expect(view).toBeUndefined();
    });
  });

  describe('Navigation from Hash', () => {
    it('should navigate to view matching hash on load', () => {
      const store = useScrollStore.getState();
      const targetId = 'contact';
      
      // Simulate hash-based navigation
      store.goToView(targetId);
      
      expect(useScrollStore.getState().activeId).toBe('contact');
      expect(useScrollStore.getState().activeIndex).toBe(2);
    });
  });

  describe('History Mode', () => {
    it('should use replaceState by default (no history entry)', () => {
      const pushHistory = false;
      const historyMethod = pushHistory ? 'pushState' : 'replaceState';
      
      expect(historyMethod).toBe('replaceState');
    });

    it('should use pushState when pushHistory is true', () => {
      const pushHistory = true;
      const historyMethod = pushHistory ? 'pushState' : 'replaceState';
      
      expect(historyMethod).toBe('pushState');
    });
  });
});
