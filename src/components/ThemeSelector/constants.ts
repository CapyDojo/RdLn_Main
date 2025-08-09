// Simple drag configuration
export const PHYSICS_CONFIG = {
  gapSize: 48, // The gap between cards - this is everything: visual, physical, landing zone
  previewOpacity: 0.3, // Opacity for the gap indicator
  performanceMode: true,
  maxFPS: 60
} as const;

// Animation timing constants
export const ANIMATION_CONFIG = {
  hoverDelay: 300, // Normal hover delay
  postDragDelay: 900, // Longer delay after drag/drop operations
  cascadeStagger: 60,
  collapseStagger: 30,
  dragTransition: 120, // Faster for more responsive feel
  normalTransition: 300
} as const;

// Layout constants
export const LAYOUT_CONFIG = {
  buttonSize: 48,
  cardWidth: 208,
  cardHeight: 60,
  baseLeftOffset: -10,
  downwardStep: 50,
  maxLeftwardStep: -15
} as const;