import { useState, useCallback, useRef } from 'react';
import { OCRService } from '../services/OCRService';
import { OCROptions, OCRLanguage } from '../types/ocr-types';
import { SUPPORTED_LANGUAGES } from '../config/ocrConfig';
import { BaseHookReturn } from '../types/components';

export interface OCRProgressPhase {
  phase: 'initialization' | 'language_detection' | 'text_extraction';
  subPhase: string;
  progress: number;
  description: string;
  estimatedTimeRemaining?: number;
  cancellable: boolean;
}

export interface OCRState {
  isProcessing: boolean;
  progress: number;
  error: string | null;
  detectedLanguages: OCRLanguage[];
  selectedLanguages: OCRLanguage[];
  autoDetect: boolean;
  currentPhase?: OCRProgressPhase;
  startTime?: number;
}

interface OCRActions {
  extractTextFromImage: (imageFile: File | Blob) => Promise<string>;
  resetOCRState: () => void;
  clearDetectedLanguages: () => void;
  setSelectedLanguages: (languages: OCRLanguage[]) => void;
  setAutoDetect: (autoDetect: boolean) => void;
  cancelOperation: () => void;
}

interface OCRReturn extends BaseHookReturn<OCRState, OCRActions> {
  // Legacy flat structure for compatibility
  isProcessing: boolean;
  progress: number;
  error: string | null;
  detectedLanguages: OCRLanguage[];
  selectedLanguages: OCRLanguage[];
  autoDetect: boolean;
  currentPhase?: OCRProgressPhase;
  startTime?: number;
  extractTextFromImage: (imageFile: File | Blob) => Promise<string>;
  resetOCRState: () => void;
  clearDetectedLanguages: () => void;
  setSelectedLanguages: (languages: OCRLanguage[]) => void;
  setAutoDetect: (autoDetect: boolean) => void;
  cancelOperation: () => void;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

export const useOCR = (): OCRReturn => {
  const [state, setState] = useState<OCRState>({
    isProcessing: false,
    progress: 0,
    error: null,
    detectedLanguages: [],
    selectedLanguages: ['eng'],
    autoDetect: true,
    currentPhase: undefined,
    startTime: undefined
  });

  const operationRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const setSelectedLanguages = useCallback((languages: OCRLanguage[]) => {
    setState(prev => ({ ...prev, selectedLanguages: languages }));
  }, []);

  const setAutoDetect = useCallback((autoDetect: boolean) => {
    setState(prev => ({ ...prev, autoDetect }));
  }, []);

  const cancelOperation = useCallback(() => {
    operationRef.current.cancelled = true;
    setState(prev => ({
      ...prev,
      isProcessing: false,
      progress: 0,
      currentPhase: undefined,
      startTime: undefined
    }));
  }, []);

  const updateProgress = useCallback((phase: OCRProgressPhase) => {
    if (operationRef.current.cancelled) return;
    
    setState(prev => ({
      ...prev,
      progress: Math.round(phase.progress * 100),
      currentPhase: phase
    }));
  }, []);

  const extractTextFromImage = useCallback(async (imageFile: File | Blob): Promise<string> => {
    // Reset cancellation flag
    operationRef.current.cancelled = false;
    
    const startTime = Date.now();
    setState(prev => ({
      ...prev,
      isProcessing: true,
      progress: 0,
      error: null,
      detectedLanguages: [],
      startTime,
      currentPhase: {
        phase: 'initialization',
        subPhase: 'starting',
        progress: 0,
        description: 'Preparing OCR system...',
        cancellable: true
      }
    }));

    try {
      // Enhanced progress callback with phase tracking
      const onProgress = (progress: number, phaseInfo?: { phase: string; description: string }) => {
        if (operationRef.current.cancelled) return;
        
        const elapsed = Date.now() - startTime;
        const phase: OCRProgressPhase = {
          phase: progress < 0.4 ? 'initialization' : progress < 0.6 ? 'language_detection' : 'text_extraction',
          subPhase: phaseInfo?.phase || 'processing',
          progress,
          description: phaseInfo?.description || 'Processing...',
          estimatedTimeRemaining: estimateTimeRemaining(progress, elapsed),
          cancellable: progress < 0.9
        };
        
        updateProgress(phase);
      };

      // Helper function to estimate remaining time
      const estimateTimeRemaining = (progress: number, elapsed: number): number => {
        if (progress <= 0) return 15000; // Initial estimate
        const estimatedTotal = elapsed / progress;
        return Math.max(1000, estimatedTotal - elapsed);
      };

      const options: OCROptions = {
        autoDetect: state.autoDetect,
        languages: state.autoDetect ? undefined : state.selectedLanguages,
        primaryLanguage: state.selectedLanguages[0],
        onProgress // Pass real progress callback
      };

      // Phase 1: OCR System Initialization (0-40%)
      updateProgress({
        phase: 'initialization',
        subPhase: 'core_loading',
        progress: 0.05,
        description: 'Loading OCR engine core...',
        cancellable: true
      });
      
      // Check for cancellation
      if (operationRef.current.cancelled) throw new Error('Operation cancelled');
      
      // Phase 2: Language Detection (40-60%)
      let detectedLanguages: OCRLanguage[] = [];
      if (state.autoDetect) {
        updateProgress({
          phase: 'language_detection',
          subPhase: 'quick_scan',
          progress: 0.4,
          description: 'Scanning document structure...',
          cancellable: true
        });
        
        detectedLanguages = await OCRService.detectLanguage(imageFile, (detectionProgress) => {
          if (operationRef.current.cancelled) return;
          
          // Map detection progress to 40-60% range with sub-phases
          const mappedProgress = 0.4 + (detectionProgress * 0.2);
          const subPhase = detectionProgress < 0.3 ? 'quick_scan' : 
                          detectionProgress < 0.7 ? 'script_analysis' : 
                          detectionProgress < 0.9 ? 'pattern_recognition' : 'confidence_calculation';
          const description = detectionProgress < 0.3 ? 'Analyzing image content...' :
                             detectionProgress < 0.7 ? 'Identifying character scripts...' :
                             detectionProgress < 0.9 ? 'Recognizing language patterns...' : 'Calculating confidence scores...';
          
          updateProgress({
            phase: 'language_detection',
            subPhase,
            progress: mappedProgress,
            description,
            cancellable: true
          });
        });
        
        if (operationRef.current.cancelled) throw new Error('Operation cancelled');
        
        setState(prev => ({ 
          ...prev, 
          detectedLanguages,
          currentPhase: {
            phase: 'language_detection',
            subPhase: 'complete',
            progress: 0.6,
            description: `Detected ${detectedLanguages.length} language${detectedLanguages.length !== 1 ? 's' : ''}`,
            cancellable: true
          }
        }));
      }

      // Phase 3: Text Extraction (60-100%)
      updateProgress({
        phase: 'text_extraction',
        subPhase: 'image_preprocessing',
        progress: 0.6,
        description: 'Preparing image for text extraction...',
        cancellable: false
      });
      
      if (operationRef.current.cancelled) throw new Error('Operation cancelled');
      
      // Enhanced progress tracking for extraction phase
      const extractionProgress = (progress: number) => {
        if (operationRef.current.cancelled) return;
        
        const extractionProgress = 0.6 + (progress * 0.4); // Map to 60-100%
        const subPhase = progress < 0.25 ? 'image_preprocessing' :
                        progress < 0.75 ? 'character_recognition' :
                        progress < 0.95 ? 'text_assembly' : 'post_processing';
        const description = progress < 0.25 ? 'Preprocessing image for OCR...' :
                           progress < 0.75 ? 'Recognizing characters and words...' :
                           progress < 0.95 ? 'Assembling extracted text...' : 'Finalizing text formatting...';
        
        updateProgress({
          phase: 'text_extraction',
          subPhase,
          progress: extractionProgress,
          description,
          cancellable: false
        });
      };
      
      const enhancedOptions = {
        ...options,
        onProgress: extractionProgress
      };
      
      const extractedText = await OCRService.extractTextFromImage(imageFile, enhancedOptions);
      
      if (operationRef.current.cancelled) throw new Error('Operation cancelled');
      
      // Final success state
      setState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        error: null,
        detectedLanguages: state.autoDetect ? detectedLanguages : [],
        currentPhase: {
          phase: 'text_extraction',
          subPhase: 'complete',
          progress: 1.0,
          description: `Successfully extracted ${extractedText.length} characters`,
          cancellable: false
        }
      }));

      // Reset progress after a short delay
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          progress: 0, 
          currentPhase: undefined,
          startTime: undefined
        }));
      }, 1500);

      return extractedText;
    } catch (error) {
      if (operationRef.current.cancelled && error instanceof Error && error.message === 'Operation cancelled') {
        // Don't show error for user-cancelled operations
        return '';
      }
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'OCR processing failed',
        currentPhase: undefined,
        startTime: undefined
      }));
      throw error;
    }
  }, [state.autoDetect, state.selectedLanguages]);

  const resetOCRState = useCallback(() => {
    setState(prev => ({
      ...prev,
      isProcessing: false,
      progress: 0,
      error: null,
      detectedLanguages: []
    }));
  }, []);

  // New function to clear detected languages when content is cleared
  const clearDetectedLanguages = useCallback(() => {
    setState(prev => ({
      ...prev,
      detectedLanguages: []
    }));
  }, []);

  const actions: OCRActions = {
    extractTextFromImage,
    resetOCRState,
    clearDetectedLanguages,
    setSelectedLanguages,
    setAutoDetect,
    cancelOperation
  };

  return {
    // Legacy flat structure for compatibility
    ...state,
    extractTextFromImage,
    resetOCRState,
    clearDetectedLanguages,
    setSelectedLanguages,
    setAutoDetect,
    cancelOperation,
    supportedLanguages: SUPPORTED_LANGUAGES,
    
    // New structured interface
    state,
    actions,
    status: { 
      ready: !state.isProcessing, 
      loading: state.isProcessing, 
      error: state.error 
    }
  };
};