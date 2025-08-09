// Theme Selector specific types
export interface DragState {
  isDragging: boolean;
  dragIndex: number | null;
  dragOverIndex: number | null;
}

export interface EnhancedDragState extends DragState {
  dragStartTime: number | null;
  lastDragOverIndex: number | null;
  dragVelocity: number;
  isSettling: boolean;
}

export interface BumpState {
  displacements: Map<number, number>;
  insertionIndex: number | null;
  rippleCenter: number | null;
}

export interface CascadePosition {
  x: number;
  y: number;
  scale: number;
  depth: number;
  bumpOffset: number;
  rippleScale: number;
}

export interface ThemeCardStyle {
  background: string;
  borderColor: string;
  borderWidth: string;
  boxShadow: string;
  filter: string;
  transform: string;
  '--theme-text-color': string;
  '--theme-dots-color': string;
  transition: string;
}