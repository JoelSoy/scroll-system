# scroll-system

[![npm version](https://img.shields.io/npm/v/scroll-system.svg)](https://www.npmjs.com/package/scroll-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**The ultimate React scroll system for immersive, TikTok-style full-screen navigation.**

Built for high-performance marketing sites, portfolios, and web apps that require a rigid, app-like scroll experience. It enforces a deterministic state machine to prevent "scroll jail" and ensure users never get stuck between views.

---

## 🌟 Key Features

| Feature | Description |
|---------|-------------|
| **Snap Views** | 4 view types: `FullView`, `ScrollLockedView`, `ControlledView`, `NestedScrollView` |
| **1:1 Touch Physics** | Native-feeling drag interaction on mobile (like TikTok/Reels) |
| **Deterministic Locking** | Smart state machine handles mixed content without bugs |
| **Accessibility** | Focus management, keyboard navigation, screen reader announcements |
| **Deep Linking** | URL hash synchronization (`#about`, `#contact`) |
| **Horizontal Support** | Works in both vertical and horizontal orientations |
| **Performance** | Lazy loading, view preloading, throttled event listeners |
| **Analytics** | Built-in view engagement tracking |

### ✨ New in v1.1.0

| Feature | Description |
|---------|-------------|
| **AutoScroll** | Automatic view advancement (carousel mode) |
| **Infinite Scroll** | Loop from last to first view |
| **Snap Points** | Multiple "stops" within a single view |
| **Parallax Effects** | Smooth parallax animations |
| **Gesture Customization** | Configurable swipe thresholds and velocities |
| **Global Progress** | Track progress across all views |
| **Programmatic Lock** | Lock/unlock navigation programmatically |
| **Auto Mobile Optimization** | Automatically prevents pull-to-refresh |

### 🚀 New in v1.5.0
| Feature | Description |
|---------|-------------|
| **Touch Overscroll Chaining** | `ScrollLockedView` can now chain navigation on mobile when scrolling past boundaries using `enableTouchPassthrough`. |

### 🆕 New in v1.4.0

| Feature | Description |
|---------|-------------|
| **Auto Overflow Detection** | `ScrollLockedView` now automatically detects if content overflows. If no overflow, it behaves like `FullView` (immediate navigation). |
| **Responsive Friendly** | Content that fits on desktop but overflows on mobile is handled automatically |
| **forceScrollLock** | Optional prop to force scroll lock behavior even without overflow |
| **Improved Timing** | Uses `requestIdleCallback` for reliable initial measurement |

---

## 📦 Installation

```bash
npm install scroll-system
# or
yarn add scroll-system
# or
pnpm add scroll-system
```

### Peer Dependencies
```json
{
  "react": ">=18.0.0",
  "react-dom": ">=18.0.0",
  "zustand": ">=4.0.0",
  "tailwindcss": ">=3.0.0"
}
```

---

## 🚀 Quick Start

Wrap your application in `ScrollContainer` and add your views. Each view **MUST** have a unique `id`.

```tsx
import { 
  ScrollContainer, 
  FullView, 
  ScrollLockedView,
  ControlledView 
} from "scroll-system";

export default function App() {
  const [hasAccepted, setHasAccepted] = useState(false);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <ScrollContainer 
        enableDragPhysics={true}
        transitionDuration={600}
        onViewChange={(from, to) => console.log(`View changed: ${from} → ${to}`)}
      >
        
        {/* Simple full-screen section */}
        <FullView id="hero" className="bg-gradient-to-b from-blue-600 to-purple-700">
          <h1>Welcome to My App</h1>
        </FullView>

        {/* Section with internal scroll */}
        <ScrollLockedView id="features">
          <div className="min-h-[200vh] p-8">
            <h2>Features</h2>
            <p>This content is taller than the viewport...</p>
            <p>User must scroll to the bottom to continue.</p>
          </div>
        </ScrollLockedView>

        {/* Logic gate - must accept to proceed */}
        <ControlledView 
          id="terms" 
          canProceed={hasAccepted}
          onActivate={() => console.log('Terms section visible')}
        >
          <h2>Terms of Service</h2>
          <button onClick={() => setHasAccepted(true)}>
            Accept Terms
          </button>
        </ControlledView>

        {/* Final section */}
        <FullView id="contact">
          <h2>Contact Us</h2>
        </FullView>

      </ScrollContainer>
    </div>
  );
}
```

---

## 🧩 Components

### `ScrollContainer`

The root wrapper component. Manages viewport, event listeners, and global state.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | Required | View components |
| `orientation` | `"vertical"` \| `"horizontal"` | `"vertical"` | Scroll direction |
| `transitionDuration` | `number` | `700` | Animation duration in ms |
| `transitionEasing` | `string` | `"cubic-bezier(0.16, 1, 0.3, 1)"` | CSS easing function |
| `enableDragPhysics` | `boolean` | `false` | Enable 1:1 touch dragging |
| `enableHashSync` | `boolean` | `false` | Sync URL hash with active view |
| `hashPrefix` | `string` | `""` | Prefix for URL hash (e.g., `"section-"`) |
| `hashPushHistory` | `boolean` | `false` | Use `pushState` instead of `replaceState` |
| `enableFocusManagement` | `boolean` | `true` | Move focus to active view for a11y |
| `respectReducedMotion` | `boolean` | `true` | Disable animations if OS prefers |
| `onViewChange` | `(from, to) => void` | - | Callback when view changes |
| `onInitialized` | `() => void` | - | Callback when system initializes |
| `skipInitialAnimation` | `boolean` | `false` | Skip animation on first render |
| `onProgress` | `(progress: number) => void` | - | Global progress callback (0-1) |
| `gestureConfig` | `GestureConfig` | - | Customize swipe thresholds |
| `autoScroll` | `AutoScrollConfig` | - | Enable automatic view advancement |
| `infiniteScroll` | `boolean \| InfiniteScrollConfig` | `false` | Loop from last to first |
| `preload` | `boolean \| PreloadConfig` | `true` | Preload adjacent views |

---

### `FullView`

Standard full-screen container. Always "unlocked" - any scroll gesture navigates away.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | Required | Unique identifier |
| `className` | `string` | `""` | CSS classes |
| `meta` | `Record<string, any>` | - | Custom metadata |
| `onActivate` | `() => void` | - | Called when view becomes active |
| `onDeactivate` | `() => void` | - | Called when view becomes inactive |
| `onEnterStart` | `() => void` | - | Called when enter transition starts |
| `onEnterEnd` | `() => void` | - | Called when enter transition ends |
| `onExitStart` | `() => void` | - | Called when exit transition starts |
| `onExitEnd` | `() => void` | - | Called when exit transition ends |

---

### `ScrollLockedView`

Smart container for long content. Automatically detects overflow and locks navigation until user scrolls to the bottom.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | Required | Unique identifier |
| `className` | `string` | `""` | CSS classes |
| `scrollDirection` | `"vertical"` \| `"horizontal"` | `"vertical"` | Internal scroll direction |
| `scrollEndThreshold` | `number` | `0.99` | Progress threshold to unlock (0-1) |
| `forceScrollLock` | `boolean` | `false` | Force lock even without overflow |
| `enableTouchPassthrough` | `boolean` | `false` | Enable touch overscroll chaining |
| `scrollResetBehavior` | `ScrollResetBehavior` | `"direction-aware"` | How to reset scroll position on activation |
| `onScrollProgress` | `(progress: number) => void` | - | Called on internal scroll |
| `onActivate` | `() => void` | - | Called when view becomes active |
| `onDeactivate` | `() => void` | - | Called when view becomes inactive |
| `onEnterStart` | `() => void` | - | Called when enter transition starts |
| `onEnterEnd` | `() => void` | - | Called when enter transition ends |
| `onExitStart` | `() => void` | - | Called when exit transition starts |
| `onExitEnd` | `() => void` | - | Called when exit transition ends |

**`ScrollResetBehavior` options:**
- `"direction-aware"` (default): Resets to **start** when navigating down (from above), resets to **end** when navigating up (from below)
- `"always-start"`: Always reset to the beginning of the scroll
- `"always-end"`: Always reset to the end of the scroll  
- `"preserve"`: Keep the current scroll position (no reset)

**Behavior:**
- If content fits viewport → Acts like `FullView`
- If content overflows → **LOCKS** navigation until user scrolls to bottom (99%)

---

### `ControlledView`

Logic gate for explicit user actions (forms, terms, payment, etc.).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | Required | Unique identifier |
| `className` | `string` | `""` | CSS classes |
| `canProceed` | `boolean` | `false` | Allow navigation to NEXT view |
| `allowGoBack` | `boolean` | `true` | Allow navigation to PREVIOUS view |
| `allowInternalScroll` | `boolean` | `false` | Enable internal scrolling |
| `scrollDirection` | `"vertical"` \| `"horizontal"` \| `"none"` | `"none"` | Internal scroll direction |
| `onActivate` | `() => void` | - | Called when view becomes active |
| `onDeactivate` | `() => void` | - | Called when view becomes inactive |
| `onEnterStart` | `() => void` | - | Called when enter transition starts |
| `onEnterEnd` | `() => void` | - | Called when enter transition ends |
| `onExitStart` | `() => void` | - | Called when exit transition starts |
| `onExitEnd` | `() => void` | - | Called when exit transition ends |

---

### `LazyView`

Performance optimization wrapper. Only renders children when view is within active range.

```tsx
<FullView id="charts">
  <LazyView viewId="charts" buffer={1}>
    <ExpensiveChartComponent />
  </LazyView>
</FullView>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `viewId` | `string` | Required | ID of the parent view |
| `buffer` | `number` | `1` | Render views within ±N of active |
| `placeholder` | `ReactNode` | `null` | Content to show when inactive |

---

### `ScrollDebugOverlay`

Development tool for visualizing system state.

```tsx
<ScrollContainer>
  {/* Views */}
  <ScrollDebugOverlay position="bottom-left" />
</ScrollContainer>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"` | `"bottom-right"` | Overlay position |

Shows: `activeIndex`, `transitioning`, `navigation state`, `metrics`, and more.

---

## 🪝 Hooks

### `useScrollSystem()`

Main API hook for programmatic control.

```tsx
const { 
  // Navigation
  goToNext,       // () => void
  goToPrev,       // () => void
  goTo,           // (index: number | id: string) => void
  
  // State
  activeIndex,    // number
  activeId,       // string | null
  totalViews,     // number
  
  // Status Checks
  isLocked,       // () => boolean
  getProgress,    // () => number (0-1)
  canGoNext,      // () => boolean
  canGoPrev,      // () => boolean
  
  // UI State
  isDragging,     // boolean
  isTransitioning // boolean
} = useScrollSystem();
```

---

### `useViewControl(viewId)`

Hook for programmatic view control from within a `ControlledView`.

```tsx
const { unlock, lock, goNext, goPrev, goTo } = useViewControl("terms");

// Unlock navigation after form completion
const handleSubmit = () => {
  saveData();
  unlock();
  goNext();
};
```

---

### `useScrollAnalytics(options)`

Track user engagement for analytics.

```tsx
useScrollAnalytics({
  onViewEnter: ({ viewId, viewIndex, enterTime }) => {
    analytics.track('Section Viewed', { viewId, index: viewIndex });
  },
  onViewExit: ({ viewId, viewIndex, duration }) => {
    analytics.track('Section Time', { viewId, seconds: duration });
  },
  enabled: process.env.NODE_ENV === 'production'
});
```

---

### `useViewProgress(viewId)`

Get scroll progress for a specific view.

```tsx
const progress = useViewProgress("features"); // 0 to 1

return (
  <div 
    className="fixed top-0 left-0 h-1 bg-blue-500" 
    style={{ width: `${progress * 100}%` }} 
  />
);
```

---

## 🆕 New Hooks (v1.1.0)

### `useGlobalProgress(options)`

Track global scroll progress across all views.

```tsx
const { progress, percentage, activeIndex } = useGlobalProgress({
  onProgress: (p) => console.log(`${p * 100}% complete`)
});

return <ProgressBar value={percentage} />;
```

---

### `useScrollLock()`

Programmatic control for locking/unlocking navigation.

```tsx
const { lock, unlock, isLocked, lockView, unlockView } = useScrollLock();

const openModal = () => {
  lock(); // Prevents all navigation
  setModalOpen(true);
};
```

---

### `useAutoScroll(config)`

Enable automatic view advancement (carousel mode).

```tsx
const { isPlaying, pause, resume, toggle } = useAutoScroll({
  enabled: true,
  interval: 4000,
  pauseOnInteraction: true,
  resumeDelay: 3000,
});

return (
  <button onClick={toggle}>
    {isPlaying ? '⏸️ Pause' : '▶️ Play'}
  </button>
);
```

---

### `useInfiniteScroll(config)`

Enable looping from last view to first.

```tsx
const { isEnabled, toggle } = useInfiniteScroll({ enabled: true });

// Or simply:
useInfiniteScroll(true);
```

---

### `useParallax(viewId, config)`

Create parallax effects within views.

```tsx
function HeroSection() {
  const { style } = useParallax("hero", { speed: 0.3 });
  
  return (
    <div style={style}>
      <img src="/background.jpg" alt="Background" />
    </div>
  );
}
```

---

### `useSnapPoints(options)`

Manage multiple "stops" within a single view.

```tsx
const snapPoints = [
  { id: 'intro', position: 0 },
  { id: 'features', position: 0.33 },
  { id: 'pricing', position: 0.66 },
  { id: 'cta', position: 1 },
];

const { activePoint, goToNextPoint, points } = useSnapPoints({
  viewId: 'landing',
  points: snapPoints,
});
```

---

### `usePreload(config)`

Control view preloading for smoother transitions.

```tsx
const { shouldPreload, preloadedViewIds } = usePreload({
  ahead: 2,  // Preload 2 views ahead
  behind: 1, // Preload 1 view behind
});
```

---

## ⌨️ Keyboard Navigation

Built-in keyboard support for accessibility:

| Key | Action |
|-----|--------|
| `↓` / `PageDown` | Navigate to next view |
| `↑` / `PageUp` | Navigate to previous view |
| `Space` | Navigate to next view |
| `Shift + Space` | Navigate to previous view |
| `Home` | Jump to first view |
| `End` | Jump to last view |

---

## 🔗 Deep Linking

Enable URL hash synchronization:

```tsx
<ScrollContainer
  enableHashSync={true}
  hashPrefix=""              // Optional: "section-" → "#section-about"
  hashPushHistory={false}    // false = replaceState, true = pushState
>
  <FullView id="about">...</FullView>    {/* URL: #about */}
  <FullView id="contact">...</FullView>  {/* URL: #contact */}
</ScrollContainer>
```

**Features:**
- URL updates when navigating
- Direct links work (`yoursite.com/#contact`)
- Browser back/forward buttons work

---

## 👆 Touch Physics

Enable 1:1 native-feeling touch interactions:

```tsx
<ScrollContainer enableDragPhysics={true}>
```

**Behavior:**
- View follows finger position in real-time
- Spring-back if released before threshold
- Velocity-aware: quick flicks trigger navigation
- Resistance at boundaries

---

## ♿ Accessibility

### Features Included
- **Focus Management**: Automatically moves focus to active view
- **Screen Readers**: `aria-live` announcements for view changes
- **Reduced Motion**: Respects `prefers-reduced-motion` OS setting
- **Keyboard Navigation**: Full arrow key + space navigation

### Recommended CSS
```css
/* Hide scrollbar but keep functionality */
.scroll-container .no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scroll-container .no-scrollbar::-webkit-scrollbar {
  display: none;
}
```

---

## 📱 Mobile Optimization

The `ScrollContainer` **automatically applies** mobile-optimized styles when mounted:
- `overscroll-behavior: none` - Prevents pull-to-refresh
- `touch-action: pan-x pan-y` - Ensures proper touch handling

These styles are automatically removed when the component unmounts.

### Fullscreen API (Optional)
```tsx
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};
```

---

## � Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Views not changing | Duplicate IDs | Ensure every view has a unique `id` |
| ScrollLockedView not scrolling | Content fits viewport | Content must be taller than `100vh` |
| `useScrollSystem` undefined | Used outside container | Must be inside `ScrollContainer` |
| Touch not working | Drag physics disabled | Set `enableDragPhysics={true}` |
| Stuck between views | Transition conflict | Check for conflicting event handlers |

---

## 📖 TypeScript

Full TypeScript support with exported types:

```tsx
import type {
  ScrollContainerProps,
  FullViewProps,
  ScrollLockedViewProps,
  ControlledViewProps,
  ScrollSystemAPI,
  ViewState,
  UserIntention
} from "scroll-system";
```

---

## 📄 License

MIT © **Joel Starck**

---

Built with ❤️ for the React community.
