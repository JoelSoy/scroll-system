/**
 * Scroll System
 * ====================
 * TikTok-style vertical/horizontal scroll system with snap views.
 *
 * @packageDocumentation
 * @module scroll-system
 */

// Components
export {
  ScrollContainer,
  FullView,
  ScrollLockedView,
  ControlledView,
  useViewControl,
  ScrollDebugOverlay,
  AriaLiveRegion,
  LazyView,
  NestedScrollView,
  NestedScrollItem,
} from "./components";

// Core Hooks
export {
  useNavigation, // Legacy (consider deprecating for useScrollSystem)
  useViewProgress,
  useActiveViewProgress,
  useWheelHandler,
  useTouchHandler,
  useKeyboardHandler,
  useHashSync,
  useDragHandler,
  useFocusManagement,
  useScrollAnalytics,
  useViewRegistration,
  useScrollSystem, // Main Public API
  useMetricsReporter,
} from "./hooks";

// Feature Hooks (v1.1.0)
export {
  useGlobalProgress,
  useScrollLock,
  usePreload,
  useAutoScroll,
  useParallax,
  useActiveParallax,
  useSnapPoints,
  createSnapPoints,
  useInfiniteScroll,
  useGestureConfig,
} from "./hooks";

// Store (Advanced access)
export {
  useScrollStore,
  selectActiveView,
  selectActiveViewProgress,
  selectCanNavigateNext,
  selectCanNavigatePrevious,
  selectGlobalProgress,
  selectIsAutoScrolling,
} from "./store";

// Types
export type {
  ViewType,
  ScrollDirection,
  NavigationState,
  ScrollCapability,
  UserIntention,
  BaseViewConfig,
  FullViewConfig,
  ScrollLockedViewConfig,
  ControlledViewConfig,
  NestedViewConfig,
  ViewConfig,
  ViewState,
  ViewMetrics,
  ScrollSystemState,
  ScrollSystemActions,
  ScrollSystemStore,
  ScrollSystemAPI,
  BaseViewProps,
  FullViewProps,
  ScrollLockedViewProps,
  ControlledViewProps,
  NestedScrollViewProps,
  ScrollContainerProps,
  // NEW: v1.1.0 Types
  GestureConfig,
  AutoScrollConfig,
  SnapPoint,
  SnapPointState,
  ParallaxConfig,
  ParallaxState,
  PreloadConfig,
  InfiniteScrollConfig,
  NestedScrollConfig,
} from "./types";

// Constants
export {
  DEFAULT_TRANSITION_DURATION,
  DEFAULT_TRANSITION_EASING,
  DEFAULT_PROGRESS_DEBOUNCE,
  NAVIGATION_COOLDOWN,
  NAV_THRESHOLDS
} from "./constants";
