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
}

// ============================================
// Tipos de Vista
// ============================================

export type ViewType = "full" | "scroll-locked" | "controlled";

export type ScrollDirection = "vertical" | "horizontal" | "none";

// ============================================
// Configuración de Vista
// ============================================

export interface BaseViewConfig {
  id: string;
  type: ViewType;
  index?: number;
  meta?: Record<string, unknown>;
}

export interface FullViewConfig extends BaseViewConfig {
  type: "full";
}

export interface ScrollLockedViewConfig extends BaseViewConfig {
  type: "scroll-locked";
  scrollDirection: ScrollDirection;
  scrollEndThreshold?: number;
}

export interface ControlledViewConfig extends BaseViewConfig {
  type: "controlled";
  scrollDirection?: ScrollDirection;
  allowInternalScroll?: boolean;
  allowGoBack?: boolean;
}

export type ViewConfig =
  | FullViewConfig
  | ScrollLockedViewConfig
  | ControlledViewConfig;

// ============================================
// Estado de Vista (State Machine)
// ============================================

export interface ViewState {
  id: string;
  index: number;
  type: ViewType;
  
  isActive: boolean;
  
  capability: ScrollCapability;
  navigation: NavigationState;
  
  explicitLock: NavigationState | null;
  
  progress: number;
  metrics: ViewMetrics;
  
  config: ViewConfig;
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
  isDragging: boolean; // True when touch drag is active
  globalProgress: number;
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
  
  // Lifecycle callbacks (existing)
  onActivate?: () => void;
  onDeactivate?: () => void;
  
  // Transition callbacks (new)
  /** Called when view starts entering (transition begins) */
  onEnterStart?: () => void;
  /** Called when view finishes entering (transition complete) */
  onEnterEnd?: () => void;
  /** Called when view starts exiting (transition begins) */
  onExitStart?: () => void;
  /** Called when view finishes exiting (transition complete) */
  onExitEnd?: () => void;
}

export interface FullViewProps extends BaseViewProps {
  meta?: Record<string, unknown>;
}

export interface ScrollLockedViewProps extends BaseViewProps {
  scrollDirection?: ScrollDirection;
  scrollEndThreshold?: number;
  onScrollProgress?: (progress: number) => void;
}

export interface ControlledViewProps extends BaseViewProps {
  scrollDirection?: ScrollDirection;
  allowInternalScroll?: boolean;
  canProceed?: boolean;
  allowGoBack?: boolean;
}

export interface ScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  transitionDuration?: number;
  transitionEasing?: string;
  onViewChange?: (fromIndex: number, toIndex: number) => void;
  onInitialized?: () => void;
  
  // Deep Linking
  /** Enable URL hash sync for deep linking (default: false) */
  enableHashSync?: boolean;
  /** Use pushState instead of replaceState for hash updates (default: false) */
  hashPushHistory?: boolean;
  /** Prefix for hash (e.g., "section-" creates "#section-hero") */
  hashPrefix?: string;
  
  // Accessibility
  /** Respect prefers-reduced-motion OS setting (default: true) */
  respectReducedMotion?: boolean;
  /** Enable focus management for screen readers (default: true) */
  enableFocusManagement?: boolean;
  
  // Touch Physics
  /** Enable 1:1 drag physics for touch devices (default: false) */
  enableDragPhysics?: boolean;
  
  // Layout
  /** Scroll orientation: vertical or horizontal (default: "vertical") */
  orientation?: "vertical" | "horizontal";
}

