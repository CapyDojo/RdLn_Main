import { useState, useCallback, useEffect, useRef } from 'react';
import { MyersAlgorithm } from '../algorithms/MyersAlgorithm';
import { ComparisonState } from '../types';
import { SYSTEM_CONFIG, STORAGE_CONFIG, UI_CONFIG } from '../config/appConfig';
import { 
  safeAsync, 
  ErrorCategory, 
  ErrorFactory, 
  ErrorManager,
  AppError 
} from '../utils/errorHandling';
import { usePerformanceMonitor } from './usePerformanceMonitor';
import { PerformanceMonitor } from '../services/PerformanceMonitor';
import { trackEvent } from '../services/AnalyticsService';

// System resource guardrails to prevent browser crashes
const checkSystemResources = (originalText: string, revisedText: string) => {
  const totalLength = originalText.length + revisedText.length;
  const estimatedChanges = Math.min(originalText.length, revisedText.length);
  
  // Check available memory (approximate)
  const memoryInfo = (performance as any)?.memory;
  const availableMemory = memoryInfo ? memoryInfo.jsHeapSizeLimit - memoryInfo.usedJSHeapSize : null;
  
  
  // Use centralized system configuration for consistent resource protection
  const { LIMITS } = SYSTEM_CONFIG;
  
  // Extreme size protection
  if (totalLength > LIMITS.MAX_DOCUMENT_LENGTH) {
    return {
      canProceed: false,
      reason: `Documents too large (>${(LIMITS.MAX_DOCUMENT_LENGTH / 1_000_000)}M characters). Please break into smaller sections to prevent system crashes.`
    };
  }
  
  // High complexity protection
  if (totalLength > LIMITS.COMPLEX_DOCUMENT_THRESHOLD && estimatedChanges > LIMITS.COMPLEX_CHANGES_THRESHOLD) {
    return {
      canProceed: false,
      reason: 'Document combination too complex. Try smaller documents or documents with fewer differences.'
    };
  }
  
  // Memory pressure protection
  if (availableMemory && availableMemory < LIMITS.MIN_AVAILABLE_MEMORY) {
    return {
      canProceed: false,
      reason: 'System memory low. Please close other browser tabs and try again.'
    };
  }
  
  // Successive operation protection
  const now = Date.now();
  const lastLargeOperation = (globalThis as any).lastLargeOperation || 0;
  if (totalLength > LIMITS.LARGE_OPERATION_THRESHOLD && (now - lastLargeOperation) < LIMITS.LARGE_OPERATION_COOLDOWN) {
    return {
      canProceed: false,
      reason: 'Please wait a moment before processing another very large document to prevent system overload.'
    };
  }
  
  // Record this operation if it's very large
  if (totalLength > LIMITS.LARGE_OPERATION_THRESHOLD) {
    (globalThis as any).lastLargeOperation = now;
  }
  
  return { canProceed: true, reason: null };
};

export const useComparison = (saveSessionCallback?: (originalText: string, revisedText: string, hasResult: boolean) => void) => {
  // SSMR SAFE: Performance monitoring integration with optional enable/disable
  const performanceMonitor = usePerformanceMonitor({
    category: 'comparison-service',
    componentName: 'useComparison',
    enabled: true, // Can be configured via environment or props
    sampleRate: 0.1 // 10% sampling for production, overridden in development
  });

  const [state, setState] = useState<ComparisonState>({
    originalText: '',
    revisedText: '',
    result: null,
    isProcessing: false,
    error: null
  });
  
  // Flag to prevent auto-compare interference during manual operations
  const manualOperationRef = useRef(false);
  
  // SSMR CHUNKING: Add separate progress tracking for large text processing
  // MODULAR: Separate from existing isProcessing state
  // REVERSIBLE: Can be disabled by setting enabled=false
  const [chunkingProgress, setChunkingProgress] = useState({
    progress: 0,
    stage: '',
    isChunking: false,
    enabled: true
  });

  // SSMR: Cancellation support with AbortController
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Auto-Compare settings using centralized storage configuration
  const [quickCompareEnabled, setQuickCompareEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_CONFIG.KEYS.AUTO_COMPARE_ENABLED);
    return stored === null ? STORAGE_CONFIG.DEFAULTS.AUTO_COMPARE_ENABLED : stored === 'true';
  });
  
  // System Protection Toggle using centralized storage configuration
  const [systemProtectionEnabled, setSystemProtectionEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_CONFIG.KEYS.SYSTEM_PROTECTION_ENABLED);
    return stored === null ? STORAGE_CONFIG.DEFAULTS.SYSTEM_PROTECTION_ENABLED : stored === 'true';
  });
  
  // Remove separate live typing state - it's now part of Auto-Compare
  
  // Debounce timer for auto-compare
  const autoCompareTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCompareInputRef = useRef<string>('');
  
  // Focus preservation for all comparisons
  const preserveFocusRef = useRef<{ element: HTMLElement | null, selectionStart: number, selectionEnd: number } | null>(null);
  
  // Utility functions for focus preservation
  const captureFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLTextAreaElement;
    if (activeElement && activeElement.tagName === 'TEXTAREA') {
      preserveFocusRef.current = {
        element: activeElement,
        selectionStart: activeElement.selectionStart || 0,
        selectionEnd: activeElement.selectionEnd || 0
      };
    }
  }, []);
  
  const restoreFocus = useCallback(() => {
    if (preserveFocusRef.current && preserveFocusRef.current.element) {
      const { element, selectionStart, selectionEnd } = preserveFocusRef.current;
      // Use setTimeout to ensure DOM updates are complete
      setTimeout(() => {
        try {
          element.focus();
          if (element instanceof HTMLTextAreaElement) {
            element.setSelectionRange(selectionStart, selectionEnd);
          }
        } catch (error) {
          console.warn('Focus restoration failed:', error);
        }
      }, 0);
    }
  }, []);

  // SSMR: Enhanced cancellation function with same robustness as ESC key
  const cancelComparison = useCallback(() => {
    // Prevent duplicate cancellation attempts (race condition protection)
    if (isCancelling) {
      return;
    }
    
    // Check if there's any processing to cancel
    if (!state.isProcessing) {
      return;
    }
    
    // Set cancelling state first to prevent race conditions
    setIsCancelling(true);
    
    // Cancel any AbortController
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (error) {
        console.warn('AbortController.abort() failed:', error);
      }
      abortControllerRef.current = null;
    }
    
    // Clear any pending auto-compare timers
    if (autoCompareTimeoutRef.current) {
      clearTimeout(autoCompareTimeoutRef.current);
      autoCompareTimeoutRef.current = null;
    }
    
    // Use requestAnimationFrame to ensure state updates happen in correct order
    requestAnimationFrame(() => {
      // Reset processing states
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: '👍 Comparison cancelled successfully',
        result: null
      }));
      
      // Reset chunking progress
      setChunkingProgress({
        progress: 0,
        stage: 'Cancelled',
        isChunking: false,
        enabled: true
      });
      
      // Clear global abort signal
      try {
        (globalThis as any).currentAbortSignal = null;
      } catch (error) {
        console.warn('Failed to clear global abort signal:', error);
      }
      
      // Reset manual operation flag to allow auto-compare again
      manualOperationRef.current = false;
      
      // Reset cancelling state after a brief delay to show feedback
      setTimeout(() => {
        setIsCancelling(false);
        
        // MEMORY CLEANUP: Force garbage collection after cancellation if available (Chrome DevTools)
        if (typeof window !== 'undefined' && (window as any).gc) {
          try {
            (window as any).gc();
            console.log('🗑️ Forced garbage collection after cancellation');
          } catch (error) {
            console.warn('Garbage collection failed:', error);
          }
        }
      }, UI_CONFIG.ANIMATION.CANCELLATION_FEEDBACK_DELAY);
      
      // Clear the cancellation success message after spotlight animation completes
      setTimeout(() => {
        setState(prev => {
          if (prev.error === '👍 Comparison cancelled successfully') {
            return { ...prev, error: null };
          }
          return prev;
        });
      }, 3400); // 3.4 seconds to let the spotlight animation complete
    });
  }, [state.isProcessing, isCancelling]);

  const compareDocuments = useCallback(async (isAutoCompare = false, preserveFocus = true, overrideOriginal?: string, overrideRevised?: string) => {
    // SSMR STEP-BY-STEP: Start performance tracking for the entire comparison operation
    const operationId = `comparison_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Track operation start with context (safe fallback)
    try {
      performanceMonitor?.trackMetric?.('comparison_started', {
        operationId,
        isAutoCompare,
        preserveFocus,
        hasOverrides: !!(overrideOriginal || overrideRevised),
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Performance tracking failed:', error);
    }

    // System resource guardrails - only check if protection is enabled
    if (systemProtectionEnabled) {
      const systemCheck = checkSystemResources(overrideOriginal ?? state.originalText, overrideRevised ?? state.revisedText);
      if (!systemCheck.canProceed) {
        console.warn('🚨 System resource guardrail triggered:', systemCheck.reason);
        
        // Track system protection triggered (safe fallback)
        try {
          performanceMonitor?.trackMetric?.('system_protection_triggered', {
            operationId,
            reason: systemCheck.reason,
            originalLength: (overrideOriginal ?? state.originalText).length,
            revisedLength: (overrideRevised ?? state.revisedText).length
          });
        } catch (error) {
          console.warn('Performance tracking failed:', error);
        }
        
        setState(prev => ({ ...prev, error: `System protection: ${systemCheck.reason}` }));
        return;
      }
    } else {
console.warn('🔥 System protection disabled - allowing unrestricted processing for stress testing');
      try {
        performanceMonitor?.trackMetric?.('system_protection_disabled', { operationId });
      } catch (error) {
        console.warn('Performance tracking failed:', error);
      }
    }
    
    // Prevent concurrent operations
    if (isAutoCompare && manualOperationRef.current) {
console.warn('⚠️ Auto-compare blocked - manual operation in progress');
      return;
    }
    
    // Additional safety check for processing state
    if (state.isProcessing && !abortControllerRef.current) {
      return;
    }
    
    // SSMR: Clean up previous AbortController before creating new one to prevent accumulation
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (error) {
        console.warn('Cleaning up previous AbortController failed:', error);
      }
    }
    
    // SSMR: Create new AbortController for cancellation
    abortControllerRef.current = new AbortController();
    setIsCancelling(false);
    
    // SSMR: Set global AbortSignal for aggressive cancellation in algorithm
    (globalThis as any).currentAbortSignal = abortControllerRef.current.signal;
    
    // Set manual operation flag if overrides are provided
    if (overrideOriginal || overrideRevised) {
      manualOperationRef.current = true;
    }
    // PHASE 1 DEBUG: Track duplicate calls
    const callId = Math.random().toString(36).substr(2, 9);
    
    // Use override texts if provided, otherwise use state
    const actualOriginal = overrideOriginal ?? state.originalText;
    const actualRevised = overrideRevised ?? state.revisedText;
    
    // Create mutable references for memory cleanup on cancellation
    let originalTextRef: string | null = actualOriginal;
    let revisedTextRef: string | null = actualRevised;
    
    // DEBUG: Critical state validation at start of comparison
    
    // Capture current focus before comparison
    if (preserveFocus) {
      captureFocus();
    }
    // Reset chunking progress at start of comparison
    setChunkingProgress({
      progress: 0,
      stage: '',
      isChunking: false,
      enabled: false // Start disabled, algorithm will enable if needed
    });
    
    setState(prev => {
      if (!actualOriginal.trim() || !actualRevised.trim()) {
        return { 
          ...prev, 
          error: 'Please enter both original and revised text to compare.' 
        };
      }
      return { ...prev, isProcessing: true, error: null };
    });

    try {
      // Track comparison start
      trackEvent.documentComparison('text', undefined);
      
      // Add small delay to show processing state
      // Shorter delay for auto-compare to feel more responsive
      await new Promise(resolve => setTimeout(resolve, isAutoCompare ? 50 : 100));
      
      // SSMR CHUNKING: Progress callback for large text processing
      // SAFE: Always create callback, use functional update to avoid stale closure
      // MODULAR: Define callback to avoid closure issues
      let progressTrackingEnabled = false;
      const progressCallback = (progress: number, stage: string) => {
console.debug(`🔄 CHUNKING PROGRESS: ${progress}% - ${stage}`);
        // First call enables tracking (algorithm decided it needs progress)
        if (!progressTrackingEnabled) {
          progressTrackingEnabled = true;
console.info('🎯 Progress tracking enabled by algorithm');
        }
        setChunkingProgress(prev => {
console.debug('🎯 Progress callback setState:', { progress, stage, prevEnabled: prev.enabled });
          const newState = {
            ...prev,
            progress,
            stage,
            isChunking: progress > 0 && progress < 100,
            enabled: true // Enable when algorithm actually uses progress
          };
          return newState;
        });
      };
      
      
      // PRIORITY 3A: Handle async MyersAlgorithm.compare for streaming support
      
      // DEBUG: Log the exact texts being compared
      
      
      // SSMR MODULAR: Wrap algorithm execution with performance tracking (safe fallback)
      const result = await (async () => {
        try {
          if (performanceMonitor?.trackOperation) {
            return await performanceMonitor.trackOperation('myers_algorithm_execution', async () => {
              // Track input characteristics for performance analysis
              try {
                performanceMonitor?.trackMetric?.('algorithm_input_metrics', {
                  operationId,
                  originalLength: actualOriginal.length,
                  revisedLength: actualRevised.length,
                  totalLength: actualOriginal.length + actualRevised.length,
                  estimatedComplexity: Math.min(actualOriginal.length, actualRevised.length)
                });
              } catch (error) {
                console.warn('Performance tracking failed:', error);
              }
              
              console.log('🎯 COMPARE: Starting MyersAlgorithm.compare', {
                originalLength: actualOriginal.length,
                revisedLength: actualRevised.length,
                hasAbortSignal: !!(globalThis as any).currentAbortSignal,
                signalAborted: (globalThis as any).currentAbortSignal?.aborted
              });
              
              // Execute the actual algorithm
              const algorithmResult = await MyersAlgorithm.compare(actualOriginal, actualRevised, progressCallback);
              
              console.log('🎯 COMPARE: MyersAlgorithm.compare completed', {
                hasResult: !!algorithmResult,
                changesCount: algorithmResult?.changes?.length || 0
              });
              
              // Track algorithm result characteristics
              if (algorithmResult) {
                try {
                  performanceMonitor?.trackMetric?.('algorithm_result_metrics', {
                    operationId,
                    changesCount: algorithmResult.changes?.length || 0,
                    hasStats: !!algorithmResult.stats,
                    resultSize: JSON.stringify(algorithmResult).length
                  });
                } catch (error) {
                  console.warn('Performance tracking failed:', error);
                }
              }
              
              return algorithmResult;
            });
          } else {
            console.log('🎯 COMPARE: Starting MyersAlgorithm.compare (fallback)', {
              originalLength: actualOriginal.length,
              revisedLength: actualRevised.length,
              hasAbortSignal: !!(globalThis as any).currentAbortSignal,
              signalAborted: (globalThis as any).currentAbortSignal?.aborted
            });
            
            // Fallback: execute algorithm without performance tracking
            const algorithmResult = await MyersAlgorithm.compare(actualOriginal, actualRevised, progressCallback);
            
            console.log('🎯 COMPARE: MyersAlgorithm.compare completed (fallback)', {
              hasResult: !!algorithmResult,
              changesCount: algorithmResult?.changes?.length || 0
            });
            
            return algorithmResult;
          }
        } catch (error) {
          console.warn('Performance tracking wrapper failed, falling back to direct execution:', error);
          
          console.log('🎯 COMPARE: Starting MyersAlgorithm.compare (error fallback)', {
            originalLength: actualOriginal.length,
            revisedLength: actualRevised.length,
            hasAbortSignal: !!(globalThis as any).currentAbortSignal,
            signalAborted: (globalThis as any).currentAbortSignal?.aborted
          });
          
          const algorithmResult = await MyersAlgorithm.compare(actualOriginal, actualRevised, progressCallback);
          
          console.log('🎯 COMPARE: MyersAlgorithm.compare completed (error fallback)', {
            hasResult: !!algorithmResult,
            changesCount: algorithmResult?.changes?.length || 0
          });
          
          return algorithmResult;
        }
      })();
      
      // CRITICAL: Test if result is valid for UI
      if (result && result.changes && result.changes.length > 0) {
        // Valid result with changes
      } else {
        console.warn('Empty or invalid comparison result');
      }
      
      // CRITICAL: Check for cancellation before setting results to prevent race condition
      if (abortControllerRef.current?.signal?.aborted || isCancelling) {
        console.log('🚫 Comparison completed but was cancelled - discarding results');
        return;
      }
      
      // 🎯 CRITICAL PERFORMANCE LOGGING FOR STATE UPDATE THAT CAUSES LAG
        // console.log('🚨 ABOUT TO UPDATE STATE WITH RESULT - THIS MAY CAUSE LAG');
      const stateUpdateStartTime = performance.now();
      
      setState(prev => {
        // console.log('🔬 Inside setState, updating with result...');
        // console.log('🔍 Previous state result:', !!prev.result);
        // console.log('🔍 New result being set:', !!result);
        // console.log('🎯 STATE UPDATE START TIME:', stateUpdateStartTime);
        
        // TESTING: Keep progress bar visible for debugging
        // TODO: Restore auto-hide after testing
        // Using functional update to access current chunking state
        setChunkingProgress(prev => {
          // Post-comparison chunking state update
          if (prev.enabled) {
            // Comment out auto-hide for testing
            // setTimeout(() => {
            //   setChunkingProgress({
            //     progress: 0,
            //     stage: '',
            //     isChunking: false,
            //     enabled: true
            //   });
            // }, 1500);
          }
          return prev; // No change for now
        });
        
        const newState = {
          ...prev,
          result,
          isProcessing: false
        };
        
        // Track successful comparison completion
        const endTime = Date.now();
        const processingTime = endTime - parseInt(operationId.split('_')[1]);
        trackEvent.documentComparison('text', processingTime);
        
        // console.log('🔍 New state being returned:', {
        //   hasResult: !!newState.result,
        //   isProcessing: newState.isProcessing,
        //   error: newState.error
        // });
        
        const stateUpdateEndTime = performance.now();
        // console.log('🎯 STATE UPDATE COMPLETED:', {
        //   stateDuration: (stateUpdateEndTime - stateUpdateStartTime).toFixed(2) + 'ms',
        //   endTime: stateUpdateEndTime
        // });
        
        return newState;
      });
      
      const postStateUpdateTime = performance.now();
      // console.log('🚨 POST-STATE UPDATE TIME:', {
      //   totalPostAlgorithmTime: (postStateUpdateTime - stateUpdateStartTime).toFixed(2) + 'ms',
      //   timestamp: postStateUpdateTime
      // });
      
      // Restore focus after comparison completes
      if (preserveFocus) {
        restoreFocus();
      }
      
      // SSMR REVERSIBLE: Track successful completion with comprehensive metrics (safe fallback)
      try {
        performanceMonitor?.trackMetric?.('comparison_completed_success', {
          operationId,
          isAutoCompare,
          resultChangesCount: result?.changes?.length || 0,
          memoryUsage: (performance as any)?.memory?.usedJSHeapSize || 0,
          timestamp: Date.now()
        });
      } catch (error) {
        console.warn('Performance tracking failed:', error);
      }
      
      // SSMR: Clear global signal on successful completion
      (globalThis as any).currentAbortSignal = null;
      
      // MEMORY CLEANUP: Nullify large text variables after successful completion
      originalTextRef = null;
      revisedTextRef = null;
      
      // Auto-save completed comparisons with different thresholds for manual vs live compare
      if (saveSessionCallback && result) {
        setTimeout(() => {
          const currentOriginal = overrideOriginal || actualOriginal;
          const currentRevised = overrideRevised || actualRevised;
          const totalContent = (currentOriginal?.length || 0) + (currentRevised?.length || 0);
          
          let shouldSave = false;
          let saveReason = '';
          
          if (!isAutoCompare) {
            // Manual compares: always save (no char threshold)
            shouldSave = true;
            saveReason = 'manual comparison';
          } else {
            // Live compares: save if total content exceeds 90 chars
            if (totalContent > 90) {
              shouldSave = true;
              saveReason = `live comparison (${totalContent} chars > 90)`;
            }
          }
          
          if (shouldSave) {
            saveSessionCallback(currentOriginal, currentRevised, true); // true = has result
            console.log(`🎯 Auto-saved ${saveReason} to RdLn Memory`);
          }
        }, 100);
      }
      
      // Clear manual operation flag after completion
      if (overrideOriginal || overrideRevised) {
        setTimeout(() => {
          manualOperationRef.current = false;
          // console.log('🔓 Manual operation completed - auto-compare re-enabled');
        }, 500); // Give enough time for any pending auto-compare calls to be blocked
      }
    } catch (error) {
      // MEMORY CLEANUP: Nullify large text variables to prevent closure memory leaks
      originalTextRef = null;
      revisedTextRef = null;
      
      // Use standardized error handling
      let appError: AppError;
      
      if (error instanceof Error) {
        // Check for cancellation error specifically
        if (error.message.includes('cancelled by user') || error.message.includes('Operation cancelled')) {
          appError = ErrorFactory.createAlgorithmError(
            error.message,
            'Comparison cancelled by user',
            {
              originalLength: actualOriginal.length,
              revisedLength: actualRevised.length,
              isAutoCompare,
              operation: 'compare_documents'
            }
          );
        }
        // Auto-categorize and create appropriate error types
        else if (error.message.includes('exceeds the UI limit')) {
          appError = ErrorFactory.createAlgorithmError(
            error.message,
            'The documents are too different or contain too many changes to display effectively. This typically happens with documents that have been extensively rewritten or are fundamentally different in structure. Try comparing smaller sections or documents with fewer changes.',
            {
              originalLength: actualOriginal.length,
              revisedLength: actualRevised.length,
              isAutoCompare,
              operation: 'compare_documents'
            }
          );
        } else if (error.message.includes('memory') || error.message.includes('Maximum')) {
          appError = ErrorFactory.createSystemError(
            error.message,
            'The documents are too large to process. Please try with smaller documents or break them into smaller sections.',
            {
              originalLength: actualOriginal.length,
              revisedLength: actualRevised.length,
              memoryInfo: (performance as any)?.memory,
              operation: 'compare_documents'
            }
          );
        } else {
          appError = ErrorFactory.createAlgorithmError(
            error.message,
            `Comparison failed: ${error.message}`,
            {
              originalLength: actualOriginal.length,
              revisedLength: actualRevised.length,
              isAutoCompare,
              operation: 'compare_documents'
            }
          );
        }
      } else {
        appError = ErrorFactory.createSystemError(
          'Unknown comparison error',
          'An unexpected error occurred while comparing documents.',
          {
            originalError: error,
            operation: 'compare_documents'
          }
        );
      }
      
      // Add retry function for retryable errors
      if (appError.category === ErrorCategory.SYSTEM || appError.category === ErrorCategory.ALGORITHM) {
        appError.retry = () => {
          // Retry with the same parameters
          compareDocuments(isAutoCompare, preserveFocus, overrideOriginal, overrideRevised);
        };
      }
      
      // SSMR: Track error with performance context for correlation (safe fallback)
      try {
        performanceMonitor?.trackMetric?.('comparison_error', {
          operationId,
          errorCategory: appError.category,
          errorMessage: appError.message,
          isAutoCompare,
          originalLength: actualOriginal.length,
          revisedLength: actualRevised.length,
          memoryUsage: (performance as any)?.memory?.usedJSHeapSize || 0,
          timestamp: Date.now()
        });
      } catch (error) {
        console.warn('Performance tracking failed:', error);
      }
      
      // Log to centralized error manager with performance context (safe fallback)
      const performanceContext = {
        recentMetrics: (() => {
          try {
            return performanceMonitor?.getRecentMetrics?.() || [];
          } catch (error) {
            console.warn('Performance metrics retrieval failed:', error);
            return [];
          }
        })(),
        memoryUsage: (performance as any)?.memory?.usedJSHeapSize || 0,
        operationId,
        componentMetrics: {
          inputLag: (() => {
            try {
              return performanceMonitor?.getLastMetricValue?.('input_lag');
            } catch (error) {
              console.warn('Performance metric retrieval failed:', error);
              return undefined;
            }
          })(),
          renderTime: (() => {
            try {
              return performanceMonitor?.getLastMetricValue?.('render_time');
            } catch (error) {
              console.warn('Performance metric retrieval failed:', error);
              return undefined;
            }
          })()
        }
      };
      
      // Add performance context to error if ErrorManager supports it
      if (typeof ErrorManager.addError === 'function' && ErrorManager.addError.length > 1) {
        (ErrorManager as any).addError(appError, performanceContext);
      } else {
        ErrorManager.addError(appError);
      }
      
      setState(prev => ({
        ...prev,
        result: null, // CRITICAL FIX: Always explicitly set result to null on error
        error: appError.userMessage,
        isProcessing: false
      }));
      
      // SAFE: Reset chunking progress on error
      setChunkingProgress(prev => {
        if (prev.enabled) {
          return {
            progress: 0,
            stage: '',
            isChunking: false,
            enabled: true
          };
        }
        return prev;
      });
      
      // Restore focus even on error
      if (preserveFocus) {
        restoreFocus();
      }
      
      // Clear manual operation flag even on error
      if (overrideOriginal || overrideRevised) {
        manualOperationRef.current = false;
        // console.log('🔓 Manual operation failed - auto-compare re-enabled');
      }
    }
  }, [state, captureFocus, restoreFocus, performanceMonitor, systemProtectionEnabled]); // Added performance monitor and protection state

  // Simplified auto-compare trigger - handles all real-time updates when enabled
  const triggerAutoCompare = useCallback((originalText: string, revisedText: string, isPasteAction = false) => {
    // triggerAutoCompare called
    
    // Don't trigger auto-compare if manual operation is in progress
    if (manualOperationRef.current) {
      // Auto-compare blocked by manual operation
      return;
    }
    
    // Clear existing timeout
    if (autoCompareTimeoutRef.current) {
      clearTimeout(autoCompareTimeoutRef.current);
    }
    
    const original = originalText.trim();
    const revised = revisedText.trim();
    const currentInput = original + '|||' + revised;
    
    // Always update if content changed (including deletions that result in empty fields)
    if (currentInput !== lastCompareInputRef.current) {
      // Unified fast debouncing for all actions
      const delay = 200; // Fast response for all input types
      
      autoCompareTimeoutRef.current = setTimeout(() => {
        // Double-check that manual operation isn't in progress when timeout fires
        if (manualOperationRef.current) {
          // Auto-compare timeout blocked by manual operation
          return;
        }
        
        lastCompareInputRef.current = currentInput;
        
        // Handle different scenarios:
        if (original && revised && original.length > 1 && revised.length > 1) {
          // Both fields have meaningful content - do comparison with explicit texts
          // CRITICAL: Pass the explicit texts to avoid stale state closure issues
          compareDocuments(true, true, originalText, revisedText);
        } else {
          // One or both fields are empty/too short - clear results
          setState(prev => ({
            ...prev,
            result: null,
            error: null
          }));
        }
      }, delay);
    }
  }, [compareDocuments, quickCompareEnabled]);

  const setOriginalText = useCallback((text: string, isPasteAction = false) => {
    // SSMR: Track text input performance for responsiveness monitoring (safe fallback)
    try {
      performanceMonitor?.trackMetric?.('text_input_original', {
        textLength: text.length,
        isPasteAction,
        quickCompareEnabled,
        timestamp: Date.now()
      });
    } catch (error) {
      // Silently ignore performance tracking errors to not break core functionality
      console.warn('Performance tracking failed:', error);
    }
    
    // setOriginalText called
    setState(prev => {
      const newState = { ...prev, originalText: text, error: null };
      
      // Trigger auto-compare for ALL changes when enabled (typing, pasting, OCR)
      if (quickCompareEnabled) {
        // Auto-compare enabled, triggering
        // Use setTimeout to ensure state is updated first
        setTimeout(() => {
          triggerAutoCompare(text, newState.revisedText || prev.revisedText, isPasteAction);
        }, 0);
      } else {
        // Auto-compare disabled
      }
      
      return newState;
    });
  }, [quickCompareEnabled, triggerAutoCompare]);

  const setRevisedText = useCallback((text: string, isPasteAction = false) => {
    // SSMR: Track text input performance for responsiveness monitoring (safe fallback)
    try {
      performanceMonitor?.trackMetric?.('text_input_revised', {
        textLength: text.length,
        isPasteAction,
        quickCompareEnabled,
        timestamp: Date.now()
      });
    } catch (error) {
      // Silently ignore performance tracking errors to not break core functionality
      console.warn('Performance tracking failed:', error);
    }
    
    // setRevisedText called
    setState(prev => {
      const newState = { ...prev, revisedText: text, error: null };
      
      // Trigger auto-compare for ALL changes when enabled (typing, pasting, OCR)
      if (quickCompareEnabled) {
        // Auto-compare enabled, triggering
        // Use setTimeout to ensure state is updated first
        setTimeout(() => {
          triggerAutoCompare(newState.originalText || prev.originalText, text, isPasteAction);
        }, 0);
      } else {
        // Auto-compare disabled
      }
      
      return newState;
    });
  }, [quickCompareEnabled, triggerAutoCompare]);

  const resetComparison = useCallback(() => {
    // Clear any pending auto-compare
    if (autoCompareTimeoutRef.current) {
      clearTimeout(autoCompareTimeoutRef.current);
      autoCompareTimeoutRef.current = null;
    }
    
    lastCompareInputRef.current = '';
    
    setState({
      originalText: '',
      revisedText: '',
      result: null,
      isProcessing: false,
      error: null
    });
    
    // Clean up old live typing setting if it exists
    localStorage.removeItem('rdln-live-typing-enabled');
    
    // Also trigger a custom event to notify TextInputPanels to clear their language detection
    window.dispatchEvent(new CustomEvent('clearLanguageDetection'));
  }, []);

  // Toggle Auto-Compare and persist preference
  const toggleQuickCompare = useCallback(() => {
    const newValue = !quickCompareEnabled;
    setQuickCompareEnabled(newValue);
    localStorage.setItem('rdln-auto-compare-enabled', newValue.toString());
    
    // Track feature usage
    trackEvent.featureUsed('quick_compare', { enabled: newValue });
    
    // 🚀 INSTANT DOPAMINE HIT: If enabling live compare and both panels have content, run comparison immediately
    if (newValue && state.originalText.trim() && state.revisedText.trim()) {
      // Live compare enabled with content - triggering instant comparison
      // Use setTimeout to ensure state updates are complete first
      setTimeout(() => {
        compareDocuments(true, false); // Auto-compare, don't preserve focus since it's a toggle action
      }, 50); // Short delay for better visual feedback
    }
  }, [quickCompareEnabled, state.originalText, state.revisedText, compareDocuments]);
  
  // Toggle System Protection and persist preference
  const toggleSystemProtection = useCallback(() => {
    const newValue = !systemProtectionEnabled;
    setSystemProtectionEnabled(newValue);
    localStorage.setItem('rdln-system-protection-enabled', newValue.toString());
    // System protection setting updated
  }, [systemProtectionEnabled]);
  

  // Cleanup timeout on unmount  
  useEffect(() => {
    return () => {
      // Clear timeouts
      if (autoCompareTimeoutRef.current) {
        clearTimeout(autoCompareTimeoutRef.current);
      }
      
      // MEMORY CLEANUP: Clean up AbortController on unmount
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        } catch (error) {
          console.warn('Cleanup AbortController on unmount failed:', error);
        }
      }
      
      // Clear global abort signal
      try {
        (globalThis as any).currentAbortSignal = null;
      } catch (error) {
        console.warn('Cleanup global signal on unmount failed:', error);
      }
    };
  }, []);

  return {
    ...state,
    setOriginalText,
    setRevisedText,
    compareDocuments,
    resetComparison,
    quickCompareEnabled,
    toggleQuickCompare,
    // SSMR: Cancellation support
    cancelComparison,
    isCancelling,
    // System Protection for stress testing
    systemProtectionEnabled,
    toggleSystemProtection,
    // SSMR CHUNKING: Export chunking progress state
    // MODULAR: Separate namespace to avoid conflicts
    chunkingProgress: {
      progress: chunkingProgress.progress,
      stage: chunkingProgress.stage,
      isChunking: chunkingProgress.isChunking,
      enabled: chunkingProgress.enabled
    },
    // SSMR SAFE: Optional performance monitoring access
    // REVERSIBLE: Can be ignored by consumers who don't need performance data
    performance: {
      monitor: performanceMonitor,
      // Convenience methods for common performance queries
      getLastComparisonDuration: () => performanceMonitor.getLastOperationTime?.() || 0,
      getRecentMetrics: () => performanceMonitor.getRecentMetrics?.() || [],
      isEnabled: performanceMonitor.isEnabled
    }
  };
};
