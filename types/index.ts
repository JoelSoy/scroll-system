/**
 * Scroll System - Type Definitions
 * ========================================
 * Sistema de scroll tipo TikTok con arquitectura determinística.
 * El Store es la única fuente de verdad.
 */

// ============================================
// Modelos de Estado (Core)
// ============================================

/**
 * Capacidad física de scroll de una vista.
 * Distingue si el contenido cabe o no en el viewport.
 */
export type ScrollCapability = "none" | "internal";

/**
 * Estado de permiso de navegación.
 */
export type NavigationState = "locked" | "unlocked";

/**
 * Métricas crudas del DOM reportadas por las vistas.
 */
export interface ViewMetrics {
  scrollHeight: number;
  clientHeight: number;
  scrollTop: number;
}

// ============================================
// Modelo de Intención de Usuario
// ============================================

export type UserIntentionType = "scroll" | "navigate";
export type UserDirection = "up" | "down" | "left" | "right";

export interface UserIntention {
  type: UserIntentionType;
  direction: UserDirection;
  strength: number; // 0-1, intensidad normalizada
  origin: "wheel" | "touch" | "keyboard" | "programmatic";
}

// ============================================
// Gesture Configuration (NEW)
// ============================================

/**
 * Configuration for gesture sensitivity and behavior.
 */
export interface GestureConfig {
  /** Minimum distance in px to trigger a swipe (default: 50) */
  swipeThreshold?: number;
  /** Minimum velocity in px/ms to trigger a swipe (default: 0.5) */
  swipeVelocity?: number;
  /** Resistance factor when dragging at boundaries 0-1 (default: 0.3) */
  dragResistance?: number;
  /** Enable/disable wheel navigation (default: true) */
  enableWheel?: boolean;
  /** Enable/disable touch navigation (default: true) */
  enableTouch?: boolean;
  /** Enable/disable keyboard navigation (default: true) */
  enableKeyboard?: boolean;
}

// ============================================
// AutoScroll Configuration (NEW)
// ============================================

/**
 * Configuration for automatic view advancement.
 */
export interface AutoScrollConfig {
  /** Enable auto-scroll functionality */
  enabled: boolean;
  /** Interval between transitions in ms */
  interval: number;
  /** Pause auto-scroll when user interacts (default: true) */
  pauseOnInteraction?: boolean;
  /** Resume delay after interaction in ms (default: 3000) */
  resumeDelay?: number;
  /** Direction of auto-scroll (default: 'forward') */
  direction?: "forward" | "backward";
  /** Stop at last view or loop (requires infiniteScroll) */
  stopAtEnd?: boolean;
}

// ============================================
// Snap Points (NEW)
// ============================================

/**
 * A snap point within a view for sub-view navigation.
 */
export interface SnapPoint {
  /** Unique identifier for the snap point */
  id: string;
  /** Position within the view as percentage 0-1 */
  position: number;
  /** Optional label for accessibility */
  label?: string;
  /** Callback when this snap point is reached */
  onReach?: () => void;
  /** Callback when leaving this snap point */
  onLeave?: () => void;
}

/**
 * State of snap points within a view.
 */
export interface SnapPointState {
  viewId: string;
  points: SnapPoint[];
  activePointId: string | null;
  activePointIndex: number;
}

// ============================================
// Parallax Configuration (NEW)
// ============================================

/**
 * Configuration for parallax effects.
 */
export interface ParallaxConfig {
  /** Speed multiplier (1 = normal, <1 = slower, >1 = faster). Default: 0.5 */
  speed?: number;
  /** Direction of parallax effect (default: matches container orientation) */
  direction?: "vertical" | "horizontal";
  /** Initial offset in pixels */
  offset?: number;
  /** Easing function for the effect */
  easing?: "linear" | "easeOut" | "easeInOut";
}

/**
 * Return type for useParallax hook.
 */
export interface ParallaxState {
  /** Current transform value in pixels */
  transform: number;
  /** CSS transform string ready to use */
  style: React.CSSProperties;
  /** Current progress 0-1 based on view visibility */
  progress: number;
}

// ============================================
// Preload Configuration (NEW)
// ============================================

/**
 * Configuration for view preloading.
 */
export interface PreloadConfig {
  /** Number of views to preload ahead (default: 1) */
  ahead?: number;
  /** Number of views to preload behind (default: 1) */
  behind?: number;
  /** Delay before preloading starts in ms (default: 100) */
  delay?: number;
}

// ============================================
// Infinite Scroll Configuration (NEW)
// ============================================

/**
 * Configuration for infinite/loop scroll behavior.
 */
export interface InfiniteScrollConfig {
  /** Enable infinite scroll (loop from last to first) */
  enabled: boolean;
  /** Direction(s) to loop (default: 'both') */
  loopDirection?: "forward" | "backward" | "both";
}

// ============================================
// Nested Scroll Configuration (NEW)
// ============================================

/**
 * Configuration for nested scroll areas.
 */
export interface NestedScrollConfig {
  /** Direction of nested scroll (perpendicular to main) */
  direction: "horizontal" | "vertical";
  /** Enable snap behavior within nested scroll */
  enableSnap?: boolean;
  /** Number of items/sections in nested scroll */
  itemCount?: number;
  /** Current active item index */
  activeItem?: number;
  /** Callback when nested item changes */
  onItemChange?: (index: number) => void;
}

// ============================================
// API Pública (Library Contract)
// ============================================

export interface ScrollSystemAPI {
  // Navegación
  goToNext: () => boolean;
  goToPrev: () => boolean;
  goTo: (index: number | string) => void;

  // Estado
  getCurrentIndex: () => number;
  getProgress: () => number; // 0-1 (Global o Local)
  getActiveViewProgress: () => number; // 0-1 (Local view progress)
  isLocked: () => boolean;
  
  // Capabilities
  canGoNext: boolean;
  canGoPrev: boolean;

  // Extended Data (for Nav/UI components)
  activeIndex: number;
  activeId: string | null;
  activeViewType: ViewType | null;
  totalViews: number;
  
  // NEW: AutoScroll control
  isAutoScrolling?: boolean;
  pauseAutoScroll?: () => void;
  resumeAutoScroll?: () => void;
}

// ============================================
// Tipos de Vista
// ============================================

export type ViewType = "full" | "scroll-locked" | "controlled" | "nested";

export type ScrollDirection = "vertical" | "horizontal" | "none";

/**
 * Behavior for resetting scroll position when view becomes active.
 * - "direction-aware": (default) Reset to start when coming from above, end when coming from below
 * - "always-start": Always reset to start
 * - "always-end": Always reset to end
 * - "preserve": Keep the current scroll position
 */
export type ScrollResetBehavior = "direction-aware" | "always-start" | "always-end" | "preserve";

// ============================================
// Configuración de Vista
// ============================================

export interface BaseViewConfig {
  id: string;
  type: ViewType;
  index?: number;
  meta?: Record<string, unknown>;
  /** Snap points within this view (NEW) */
  snapPoints?: SnapPoint[];
}

export interface FullViewConfig extends BaseViewConfig {
  type: "full";
}

export interface ScrollLockedViewConfig extends BaseViewConfig {
  type: "scroll-locked";
  scrollDirection: ScrollDirection;
  scrollEndThreshold?: number;
  /** Behavior for resetting scroll when view becomes active (default: "direction-aware") */
  scrollResetBehavior?: ScrollResetBehavior;
}

export interface ControlledViewConfig extends BaseViewConfig {
  type: "controlled";
  scrollDirection?: ScrollDirection;
  allowInternalScroll?: boolean;
  allowGoBack?: boolean;
}

export interface NestedViewConfig extends BaseViewConfig {
  type: "nested";
  nestedConfig: NestedScrollConfig;
}

export type ViewConfig =
  | FullViewConfig
  | ScrollLockedViewConfig
  | ControlledViewConfig
  | NestedViewConfig;

// ============================================
// Estado de Vista (State Machine)
// ============================================

export interface ViewState {
  id: string;
  index: number;
  type: ViewType;
  
  isActive: boolean;
  /** NEW: Is this view preloaded */
  isPreloaded: boolean;
  
  capability: ScrollCapability;
  navigation: NavigationState;
  
  explicitLock: NavigationState | null;
  
  progress: number;
  metrics: ViewMetrics;
  
  config: ViewConfig;
  
  /** NEW: Active snap point within this view */
  activeSnapPointId: string | null;
}

// ============================================
// Estado Global del Sistema
// ============================================

export interface ScrollSystemState {
  views: ViewState[];
  activeIndex: number;
  activeId: string | null;
  totalViews: number;
  
  isInitialized: boolean;
  isTransitioning: boolean;
  isGlobalLocked: boolean;
  isDragging: boolean;
  globalProgress: number;
  
  /** NEW: AutoScroll state */
  isAutoScrolling: boolean;
  isAutoScrollPaused: boolean;
  
  /** NEW: Infinite scroll enabled */
  infiniteScrollEnabled: boolean;
  
  /** NEW: Last navigation direction (for scroll reset behavior) */
  lastNavigationDirection: "up" | "down" | null;
}

// ============================================
// Acciones del Sistema
// ============================================

export interface ScrollSystemActions {
  initialize: () => void;
  registerView: (config: ViewConfig) => void;
  unregisterView: (id: string) => void;

  // Input Processing
  processIntention: (intention: UserIntention) => boolean;

  // Navegación (Raw Actions)
  goToNext: () => void;
  goToPrevious: () => void;
  goToView: (indexOrId: number | string) => void;

  // Reporte (DOM -> Store)
  updateViewMetrics: (id: string, metrics: ViewMetrics) => void;

  // Overrides
  setViewExplicitLock: (id: string, lock: NavigationState | null) => void;
  setGlobalLock: (locked: boolean) => void;
  setDragging: (dragging: boolean) => void;

  // Transiciones
  startTransition: () => void;
  endTransition: () => void;
  
  // NEW: AutoScroll control
  setAutoScrolling: (enabled: boolean) => void;
  setAutoScrollPaused: (paused: boolean) => void;
  
  // NEW: Infinite scroll
  setInfiniteScrollEnabled: (enabled: boolean) => void;
  
  // NEW: Preload
  setViewPreloaded: (id: string, preloaded: boolean) => void;
  
  // NEW: Snap points
  setActiveSnapPoint: (viewId: string, snapPointId: string | null) => void;
  
  // Testing/Internal
  resetNavigationCooldown: () => void;
}

export type ScrollSystemStore = ScrollSystemState & ScrollSystemActions;

// ============================================
// Props de Componentes
// ============================================

export interface BaseViewProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  
  // Lifecycle callbacks
  onActivate?: () => void;
  onDeactivate?: () => void;
  
  // Transition callbacks
  onEnterStart?: () => void;
  onEnterEnd?: () => void;
  onExitStart?: () => void;
  onExitEnd?: () => void;
  
  /** NEW: Snap points within this view */
  snapPoints?: SnapPoint[];
  /** NEW: Callback when snap point changes */
  onSnapPointChange?: (snapPointId: string | null) => void;
}

export interface FullViewProps extends BaseViewProps {
  meta?: Record<string, unknown>;
}

export interface ScrollLockedViewProps extends BaseViewProps {
  scrollDirection?: ScrollDirection;
  scrollEndThreshold?: number;
  onScrollProgress?: (progress: number) => void;
  /** Behavior for resetting scroll when view becomes active (default: "direction-aware") */
  scrollResetBehavior?: ScrollResetBehavior;
  /** Force scroll lock behavior even without overflow (default: false) */
  forceScrollLock?: boolean;
}

export interface ControlledViewProps extends BaseViewProps {
  scrollDirection?: ScrollDirection;
  allowInternalScroll?: boolean;
  canProceed?: boolean;
  allowGoBack?: boolean;
}

/** NEW: Props for NestedScrollView component */
export interface NestedScrollViewProps extends BaseViewProps {
  /** Direction of nested scroll (perpendicular to main) */
  nestedDirection?: "horizontal" | "vertical";
  /** Enable snap behavior within nested scroll */
  enableSnap?: boolean;
  /** Callback when nested item changes */
  onItemChange?: (index: number) => void;
}

export interface ScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  transitionDuration?: number;
  transitionEasing?: string;
  onViewChange?: (fromIndex: number, toIndex: number) => void;
  onInitialized?: () => void;
  
  // Deep Linking
  enableHashSync?: boolean;
  hashPushHistory?: boolean;
  hashPrefix?: string;
  
  // Accessibility
  respectReducedMotion?: boolean;
  enableFocusManagement?: boolean;
  
  // Touch Physics
  enableDragPhysics?: boolean;
  
  // Layout
  orientation?: "vertical" | "horizontal";
  
  // NEW: Skip Initial Animation
  /** Skip the initial animation when mounting (default: false) */
  skipInitialAnimation?: boolean;
  
  // NEW: Global Progress
  /** Callback reporting global scroll progress 0-1 */
  onProgress?: (progress: number) => void;
  
  // NEW: Gesture Configuration
  /** Custom gesture sensitivity and behavior */
  gestureConfig?: GestureConfig;
  
  // NEW: AutoScroll
  /** Enable automatic view advancement */
  autoScroll?: AutoScrollConfig;
  
  // NEW: Infinite Scroll
  /** Enable looping from last to first view */
  infiniteScroll?: boolean | InfiniteScrollConfig;
  
  // NEW: Preload
  /** Configure view preloading */
  preload?: boolean | PreloadConfig;
}

