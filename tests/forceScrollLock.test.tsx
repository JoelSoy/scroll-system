
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import React, { useState } from 'react';
import { ScrollLockedView } from '../components/ScrollLockedView';
import { useScrollStore } from '../store/navigation.store';

describe('forceScrollLock Reactivity', () => {
    beforeEach(() => {
        useScrollStore.setState({
            views: [],
            activeIndex: 0,
            activeId: null,
            totalViews: 0,
            isInitialized: false,
        });
    });

    it('should update navigation state when forceScrollLock prop changes', () => {
        // Wrapper component to simulate prop updates
        function TestComponent() {
            const [force, setForce] = useState(false);
            
            return (
                <div>
                    <ScrollLockedView id="test-view" forceScrollLock={force}>
                        Content
                    </ScrollLockedView>
                    <button onClick={() => setForce(true)}>Toggle Force</button>
                    <button onClick={() => setForce(false)}>Untoggle Force</button>
                </div>
            )
        }
        
        const { getByText } = render(<TestComponent />);
        
        // Force initialization if needed (usually handled by ScrollContainer but here we test view in isolation)
        // Note: ScrollLockedView registers itself on mount
        
        let view = useScrollStore.getState().views[0];
        expect(view).toBeDefined();
        expect(view.id).toBe('test-view');
        
        // Initial state: metrics are 0 (no layout), capability="none"
        // forceScrollLock = false
        // Therefore navigation should be "unlocked"
        expect(view.navigation).toBe('unlocked');
        
        // Toggle forceScrollLock -> true
        const toggleBtn = getByText('Toggle Force');
        
        act(() => {
            toggleBtn.click();
        });
        
        // Check store update
        view = useScrollStore.getState().views[0];
        const config = view.config as any;
        
        // 1. Config should be updated
        expect(config.forceScrollLock).toBe(true);
        
        // 2. Navigation should be "locked" because forceScrollLock is true, even if capability is "none"
        expect(view.navigation).toBe('locked');
        
        // Toggle back -> false
        const untoggleBtn = getByText('Untoggle Force');
        
        act(() => {
            untoggleBtn.click();
        });
        
        view = useScrollStore.getState().views[0];
        expect((view.config as any).forceScrollLock).toBe(false);
        expect(view.navigation).toBe('unlocked');
    });
});
