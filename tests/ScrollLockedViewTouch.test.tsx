
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { ScrollLockedView } from '../components/ScrollLockedView';
import { useScrollStore } from '../store/navigation.store';

// Mock del store
const mockProcessIntention = vi.fn();

// Mock partial implementation of store to intercept processIntention
// We need to spy on the actual store instance
const originalGetState = useScrollStore.getState;

describe('ScrollLockedView Touch Passthrough', () => {
    beforeEach(() => {
        useScrollStore.setState({
            views: [],
            processIntention: mockProcessIntention,
            // ... reset other state if needed
        });
        mockProcessIntention.mockClear();
    });

    it('should trigger navigation on bottom overscroll when enabled', () => {
        const { getByTestId, container } = render(
            <ScrollLockedView 
                id="test-touch" 
                enableTouchPassthrough={true}
            >
                <div style={{ height: '2000px' }}>Content</div>
            </ScrollLockedView>
        );
        
        const scrollContainer = container.querySelector('[data-scrollable="true"]');
        expect(scrollContainer).toBeTruthy();
        if (!scrollContainer) return;

        // Mock scroll properties
        // Case: Scrolled to bottom
        Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, configurable: true });
        Object.defineProperty(scrollContainer, 'clientHeight', { value: 500, configurable: true });
        Object.defineProperty(scrollContainer, 'scrollTop', { value: 500, configurable: true }); // Max scroll
        
        // 1. Touch Start
        fireEvent.touchStart(scrollContainer, {
            touches: [{ clientY: 500 }]
        });
        
        // 2. Touch End (Swipe UP -> Finger moves from 500 to 400 -> deltaY = 100)
        // This means "pulling up", which indicates user wants to go DOWN/NEXT
        fireEvent.touchEnd(scrollContainer, {
            changedTouches: [{ clientY: 400 }]
        });
        
        expect(mockProcessIntention).toHaveBeenCalledWith({
            type: 'navigate',
            direction: 'down',
            strength: 1,
            origin: 'touch'
        });
    });

    it('should NOT trigger navigation if enableTouchPassthrough is false', () => {
        const { container } = render(
            <ScrollLockedView 
                id="test-touch-disabled" 
                enableTouchPassthrough={false}
            >
                <div style={{ height: '2000px' }}>Content</div>
            </ScrollLockedView>
        );
        
        const scrollContainer = container.querySelector('[data-scrollable="true"]');
        if (!scrollContainer) return;

        // Mock scroll properties (Bottom)
        Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, configurable: true });
        Object.defineProperty(scrollContainer, 'clientHeight', { value: 500, configurable: true });
        Object.defineProperty(scrollContainer, 'scrollTop', { value: 500, configurable: true });

        // Swipe UP
        fireEvent.touchStart(scrollContainer, { touches: [{ clientY: 500 }] });
        fireEvent.touchEnd(scrollContainer, { changedTouches: [{ clientY: 400 }] });
        
        expect(mockProcessIntention).not.toHaveBeenCalled();
    });

    it('should NOT trigger navigation if not at boundary', () => {
         const { container } = render(
            <ScrollLockedView 
                id="test-touch-middle" 
                enableTouchPassthrough={true}
            >
                <div style={{ height: '2000px' }}>Content</div>
            </ScrollLockedView>
        );
        
        const scrollContainer = container.querySelector('[data-scrollable="true"]');
        if (!scrollContainer) return;

        // Mock scroll properties (Middle)
        Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, configurable: true });
        Object.defineProperty(scrollContainer, 'clientHeight', { value: 500, configurable: true });
        Object.defineProperty(scrollContainer, 'scrollTop', { value: 250, configurable: true }); // Middle

        // Swipe UP
        fireEvent.touchStart(scrollContainer, { touches: [{ clientY: 500 }] });
        fireEvent.touchEnd(scrollContainer, { changedTouches: [{ clientY: 400 }] });
        
        expect(mockProcessIntention).not.toHaveBeenCalled();
    });
});
