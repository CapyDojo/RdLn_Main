/**
 * OCR Progress Tracking Utilities
 * 
 * Comprehensive progress tracking system for OCR operations with:
 * - Phase-based progress management
 * - Time estimation and performance monitoring
 * - Smooth progress interpolation
 * - Cancellation support
 */

export interface OCRProgressPhase {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1, how much of total progress this phase represents
  estimatedDuration: number; // milliseconds
  cancellable: boolean;
}

export interface OCRProgressState {
  currentPhase: OCRProgressPhase | null;
  overallProgress: number; // 0-1
  phaseProgress: number; // 0-1, progress within current phase
  startTime: number;
  estimatedTimeRemaining: number;
  cancelled: boolean;
}

export interface OCRProgressCallbacks {
  onProgress: (state: OCRProgressState) => void;
  onPhaseChange: (newPhase: OCRProgressPhase, oldPhase: OCRProgressPhase | null) => void;
  onComplete: (totalTime: number) => void;
  onError: (error: Error, phase: OCRProgressPhase | null) => void;
}

/**
 * Predefined OCR operation phases with realistic timing estimates
 */
export const OCR_PHASES: Record<string, OCRProgressPhase> = {
  CORE_LOADING: {
    id: 'core_loading',
    name: 'Core Loading',
    description: 'Loading Tesseract OCR engine...',
    weight: 0.15,
    estimatedDuration: 2000,
    cancellable: true
  },
  WORKER_CREATION: {
    id: 'worker_creation',
    name: 'Worker Creation',
    description: 'Creating OCR worker thread...',
    weight: 0.10,
    estimatedDuration: 1500,
    cancellable: true
  },
  LANGUAGE_LOADING: {
    id: 'language_loading',
    name: 'Language Loading',
    description: 'Loading language recognition data...',
    weight: 0.15,
    estimatedDuration: 3000,
    cancellable: true
  },
  QUICK_SCAN: {
    id: 'quick_scan',
    name: 'Document Scan',
    description: 'Scanning document structure...',
    weight: 0.05,
    estimatedDuration: 1000,
    cancellable: true
  },
  SCRIPT_ANALYSIS: {
    id: 'script_analysis',
    name: 'Script Analysis',
    description: 'Analyzing character scripts...',
    weight: 0.10,
    estimatedDuration: 1500,
    cancellable: true
  },
  PATTERN_RECOGNITION: {
    id: 'pattern_recognition',
    name: 'Pattern Recognition',
    description: 'Identifying language patterns...',
    weight: 0.05,
    estimatedDuration: 1000,
    cancellable: true
  },
  IMAGE_PREPROCESSING: {
    id: 'image_preprocessing',
    name: 'Image Preprocessing',
    description: 'Preparing image for OCR...',
    weight: 0.10,
    estimatedDuration: 2000,
    cancellable: false
  },
  CHARACTER_RECOGNITION: {
    id: 'character_recognition',
    name: 'Text Recognition',
    description: 'Recognizing characters and words...',
    weight: 0.25,
    estimatedDuration: 8000,
    cancellable: false
  },
  TEXT_ASSEMBLY: {
    id: 'text_assembly',
    name: 'Text Assembly',
    description: 'Assembling extracted text...',
    weight: 0.03,
    estimatedDuration: 500,
    cancellable: false
  },
  POST_PROCESSING: {
    id: 'post_processing',
    name: 'Post Processing',
    description: 'Finalizing text formatting...',
    weight: 0.02,
    estimatedDuration: 300,
    cancellable: false
  }
};

/**
 * OCR Progress Tracker class for managing complex OCR operation progress
 */
export class OCRProgressTracker {
  private state: OCRProgressState;
  private callbacks: OCRProgressCallbacks;
  private phaseSequence: OCRProgressPhase[];
  private currentPhaseIndex: number = -1;
  private phaseStartTime: number = 0;
  private interpolationTimer: NodeJS.Timeout | null = null;

  constructor(phaseSequence: OCRProgressPhase[], callbacks: OCRProgressCallbacks) {
    this.phaseSequence = phaseSequence;
    this.callbacks = callbacks;
    this.state = {
      currentPhase: null,
      overallProgress: 0,
      phaseProgress: 0,
      startTime: Date.now(),
      estimatedTimeRemaining: this.calculateTotalEstimatedTime(),
      cancelled: false
    };
  }

  /**
   * Start the OCR operation and begin progress tracking
   */
  start(): void {
    this.state.startTime = Date.now();
    this.nextPhase();
  }

  /**
   * Move to the next phase in the sequence
   */
  nextPhase(): void {
    if (this.state.cancelled) return;

    const oldPhase = this.state.currentPhase;
    this.currentPhaseIndex++;

    if (this.currentPhaseIndex >= this.phaseSequence.length) {
      // Operation complete
      this.complete();
      return;
    }

    const newPhase = this.phaseSequence[this.currentPhaseIndex];
    this.state.currentPhase = newPhase;
    this.state.phaseProgress = 0;
    this.phaseStartTime = Date.now();

    // Calculate overall progress based on completed phases
    let completedWeight = 0;
    for (let i = 0; i < this.currentPhaseIndex; i++) {
      completedWeight += this.phaseSequence[i].weight;
    }
    this.state.overallProgress = completedWeight;

    this.updateEstimatedTime();
    this.callbacks.onPhaseChange(newPhase, oldPhase);
    this.notifyProgress();

    // Start synthetic progress for phases without real progress tracking
    this.startSyntheticProgress();
  }

  /**
   * Update progress within the current phase
   */
  updatePhaseProgress(progress: number): void {
    if (this.state.cancelled || !this.state.currentPhase) return;

    this.state.phaseProgress = Math.max(0, Math.min(1, progress));
    
    // Calculate overall progress
    let completedWeight = 0;
    for (let i = 0; i < this.currentPhaseIndex; i++) {
      completedWeight += this.phaseSequence[i].weight;
    }
    
    const currentPhaseContribution = this.state.currentPhase.weight * this.state.phaseProgress;
    this.state.overallProgress = completedWeight + currentPhaseContribution;

    this.updateEstimatedTime();
    this.notifyProgress();
  }

  /**
   * Skip to a specific phase (useful for operations that jump phases)
   */
  skipToPhase(phaseId: string, progress: number = 0): void {
    const phaseIndex = this.phaseSequence.findIndex(p => p.id === phaseId);
    if (phaseIndex === -1) return;

    this.currentPhaseIndex = phaseIndex - 1; // Will be incremented in nextPhase
    this.nextPhase();
    this.updatePhaseProgress(progress);
  }

  /**
   * Mark the operation as complete
   */
  complete(): void {
    if (this.state.cancelled) return;

    this.clearInterpolation();
    this.state.overallProgress = 1;
    this.state.phaseProgress = 1;
    this.state.estimatedTimeRemaining = 0;

    const totalTime = Date.now() - this.state.startTime;
    this.callbacks.onComplete(totalTime);
  }

  /**
   * Cancel the operation
   */
  cancel(): void {
    this.state.cancelled = true;
    this.clearInterpolation();
  }

  /**
   * Handle errors during operation
   */
  error(error: Error): void {
    this.clearInterpolation();
    this.callbacks.onError(error, this.state.currentPhase);
  }

  /**
   * Get current progress state
   */
  getState(): OCRProgressState {
    return { ...this.state };
  }

  /**
   * Private method to start synthetic progress updates
   */
  private startSyntheticProgress(): void {
    if (!this.state.currentPhase) return;

    this.clearInterpolation();

    const phase = this.state.currentPhase;
    const startTime = Date.now();

    this.interpolationTimer = setInterval(() => {
      if (this.state.cancelled) {
        this.clearInterpolation();
        return;
      }

      const elapsed = Date.now() - startTime;
      const estimatedProgress = Math.min(0.9, elapsed / phase.estimatedDuration);
      
      // Add natural variation to make progress feel more alive
      const jitter = (Math.sin(Date.now() / 1000) * 0.02) + 0.02;
      const syntheticProgress = Math.min(0.95, estimatedProgress + jitter);

      this.updatePhaseProgress(syntheticProgress);
    }, 100); // Update every 100ms for smooth animation
  }

  /**
   * Clear synthetic progress interpolation
   */
  private clearInterpolation(): void {
    if (this.interpolationTimer) {
      clearInterval(this.interpolationTimer);
      this.interpolationTimer = null;
    }
  }

  /**
   * Calculate total estimated time for all phases
   */
  private calculateTotalEstimatedTime(): number {
    return this.phaseSequence.reduce((total, phase) => total + phase.estimatedDuration, 0);
  }

  /**
   * Update estimated time remaining based on current progress
   */
  private updateEstimatedTime(): void {
    const elapsed = Date.now() - this.state.startTime;
    
    if (this.state.overallProgress <= 0) {
      this.state.estimatedTimeRemaining = this.calculateTotalEstimatedTime();
      return;
    }

    // Calculate remaining phases
    let remainingWeight = 0;
    for (let i = this.currentPhaseIndex + 1; i < this.phaseSequence.length; i++) {
      remainingWeight += this.phaseSequence[i].weight;
    }

    // Add remaining time for current phase
    if (this.state.currentPhase && this.state.phaseProgress < 1) {
      const currentPhaseRemaining = this.state.currentPhase.weight * (1 - this.state.phaseProgress);
      remainingWeight += currentPhaseRemaining;
    }

    // Estimate based on current velocity
    const velocity = this.state.overallProgress / elapsed;
    this.state.estimatedTimeRemaining = Math.max(1000, remainingWeight / velocity);
  }

  /**
   * Notify callbacks of progress update
   */
  private notifyProgress(): void {
    this.callbacks.onProgress({ ...this.state });
  }
}

/**
 * Create standard OCR operation phase sequences
 */
export const createOCRPhaseSequence = {
  /**
   * Full OCR operation with auto-detection
   */
  fullWithDetection: (): OCRProgressPhase[] => [
    OCR_PHASES.CORE_LOADING,
    OCR_PHASES.WORKER_CREATION,
    OCR_PHASES.LANGUAGE_LOADING,
    OCR_PHASES.QUICK_SCAN,
    OCR_PHASES.SCRIPT_ANALYSIS,
    OCR_PHASES.PATTERN_RECOGNITION,
    OCR_PHASES.IMAGE_PREPROCESSING,
    OCR_PHASES.CHARACTER_RECOGNITION,
    OCR_PHASES.TEXT_ASSEMBLY,
    OCR_PHASES.POST_PROCESSING
  ],

  /**
   * OCR operation without language detection
   */
  extractionOnly: (): OCRProgressPhase[] => [
    OCR_PHASES.CORE_LOADING,
    OCR_PHASES.WORKER_CREATION,
    OCR_PHASES.LANGUAGE_LOADING,
    OCR_PHASES.IMAGE_PREPROCESSING,
    OCR_PHASES.CHARACTER_RECOGNITION,
    OCR_PHASES.TEXT_ASSEMBLY,
    OCR_PHASES.POST_PROCESSING
  ],

  /**
   * Language detection only
   */
  detectionOnly: (): OCRProgressPhase[] => [
    OCR_PHASES.CORE_LOADING,
    OCR_PHASES.WORKER_CREATION,
    OCR_PHASES.LANGUAGE_LOADING,
    OCR_PHASES.QUICK_SCAN,
    OCR_PHASES.SCRIPT_ANALYSIS,
    OCR_PHASES.PATTERN_RECOGNITION
  ]
};

/**
 * Helper function to format time remaining for display
 */
export const formatTimeRemaining = (milliseconds: number): string => {
  const seconds = Math.ceil(milliseconds / 1000);
  
  if (seconds < 5) return 'Almost done...';
  if (seconds < 60) return `~${seconds}s remaining`;
  
  const minutes = Math.ceil(seconds / 60);
  return `~${minutes}m remaining`;
};

/**
 * Helper function to get progress percentage as string
 */
export const formatProgress = (progress: number): string => {
  return `${Math.round(progress * 100)}%`;
};