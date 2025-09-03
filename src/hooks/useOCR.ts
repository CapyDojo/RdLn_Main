import { useState, useCallback, useRef } from 'react';
// 20250829 - OCR_Engine refactor - code change - Codex/GPT5
// Route all OCR through the single front door
import { OCR_Engine } from '../services/OCR_Engine';
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
      // Simplified progress callback
      const onProgress = (progress: number, phaseInfo?: { phase: string; description: string }) => {
        if (operationRef.current.cancelled) return;
        
        const elapsed = Date.now() - startTime;
        const phase: OCRProgressPhase = {
          phase: 'text_extraction', 
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

      // Build options for the unified extract call
      const extractionOptions: OCROptions = {
        languages: state.autoDetect ? undefined : state.selectedLanguages,
        onProgress: onProgress
      };
      
      if (operationRef.current.cancelled) throw new Error('Operation cancelled');

      // Single call to the engine
      const { text: extractedText } = await OCR_Engine.extract(imageFile, extractionOptions);
      
      if (operationRef.current.cancelled) throw new Error('Operation cancelled');
      
      // Final success state
      setState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        error: null,
        detectedLanguages: [], 
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
