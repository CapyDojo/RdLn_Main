/**
 * Standardized OCR Error Handling Utilities
 * 
 * This module provides standardized error detection and handling patterns
 * for OCR services to ensure consistent error behavior across the application.
 */

/**
 * Error pattern detection utilities
 */
export class OCRErrorDetection {
  
  /**
   * Identifies legacy model errors that indicate the worker lacks Legacy model support
   */
  static isLegacyError(error: unknown): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Known legacy model error patterns
    const legacyErrorPatterns = [
      'worker.detect requires Legacy model',
      'detect requires Legacy model',
      'legacy',
      'Legacy model required',
      'OSD requires legacy',
      'Orientation and Script Detection requires legacy'
    ];
    
    return legacyErrorPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Identifies worker validation failures (null worker, terminated worker, invalid methods)
   */
  static isWorkerValidationError(error: unknown): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Known worker validation error patterns
    const workerValidationPatterns = [
      'Worker is invalid',
      'does not support detect method',
      'worker is null',
      'worker is undefined',
      'worker terminated',
      'postMessage',
      'Cannot read properties of null',
      'Cannot read properties of undefined',
      'worker.detect is not a function',
      'worker.recognize is not a function'
    ];
    
    return workerValidationPatterns.some(pattern =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Identifies Tesseract parameter setting errors
   */
  static isParameterSettingError(error: unknown): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Known parameter setting error patterns
    const parameterErrorPatterns = [
      'setParameters failed',
      'invalid parameter',
      'parameter not recognized',
      'tessedit_ocr_engine_mode',
      'engine mode',
      'Unable to set parameter'
    ];
    
    return parameterErrorPatterns.some(pattern =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Identifies worker lifecycle errors (initialization, termination)
   */
  static isWorkerLifecycleError(error: unknown): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Known worker lifecycle error patterns
    const lifecycleErrorPatterns = [
      'Worker timeout',
      'initialization failed',
      'Failed to create worker',
      'worker creation failed',
      'terminate failed',
      'worker already terminated',
      'initialization timeout'
    ];
    
    return lifecycleErrorPatterns.some(pattern =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Identifies network/resource loading errors
   */
  static isResourceLoadingError(error: unknown): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Known resource loading error patterns
    const resourceErrorPatterns = [
      'network',
      'fetch',
      'loading language traineddata',
      'language file not found',
      'tesseract-core',
      'Failed to load',
      'CORS',
      'Not Found'
    ];
    
    return resourceErrorPatterns.some(pattern =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Comprehensive error categorization
   */
  static categorizeError(error: unknown): {
    category: 'legacy' | 'worker_validation' | 'parameter_setting' | 'worker_lifecycle' | 'resource_loading' | 'unknown';
    isRecoverable: boolean;
    recommendedAction: string;
  } {
    if (this.isLegacyError(error)) {
      return {
        category: 'legacy',
        isRecoverable: true,
        recommendedAction: 'Create worker with legacy support enabled, or fallback to English-only detection'
      };
    }

    if (this.isWorkerValidationError(error)) {
      return {
        category: 'worker_validation',
        isRecoverable: true,
        recommendedAction: 'Clear cached worker and create new worker instance'
      };
    }

    if (this.isParameterSettingError(error)) {
      return {
        category: 'parameter_setting',
        isRecoverable: true,
        recommendedAction: 'Skip parameter setting or use default configuration'
      };
    }

    if (this.isWorkerLifecycleError(error)) {
      return {
        category: 'worker_lifecycle',
        isRecoverable: true,
        recommendedAction: 'Retry worker creation with different configuration or timeout'
      };
    }

    if (this.isResourceLoadingError(error)) {
      return {
        category: 'resource_loading',
        isRecoverable: true,
        recommendedAction: 'Fallback to CDN resources or use minimal language set'
      };
    }

    return {
      category: 'unknown',
      isRecoverable: false,
      recommendedAction: 'Log error details and use fallback mechanism'
    };
  }
}

/**
 * Standardized error handling methods
 */
export class OCRErrorHandler {
  
  /**
   * Handles worker validation failures consistently
   */
  static handleWorkerValidationFailure(
    error: unknown, 
    workerContext: string,
    fallbackAction: () => Promise<any>
  ): Promise<any> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCategory = OCRErrorDetection.categorizeError(error);
    
    console.warn(`⚠️ Worker validation failed in ${workerContext}:`, {
      error: errorMessage,
      category: errorCategory.category,
      isRecoverable: errorCategory.isRecoverable,
      recommendedAction: errorCategory.recommendedAction
    });

    if (errorCategory.isRecoverable) {
      console.log(`🔄 Attempting recovery for ${workerContext}: ${errorCategory.recommendedAction}`);
      return fallbackAction();
    } else {
      throw new Error(`Unrecoverable worker validation error in ${workerContext}: ${errorMessage}`);
    }
  }

  /**
   * Creates standardized error messages for OCR operations
   */
  static createStandardizedErrorMessage(
    operation: string,
    error: unknown,
    context?: Record<string, any>
  ): string {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCategory = OCRErrorDetection.categorizeError(error);
    
    let message = `OCR ${operation} failed: ${errorMessage}`;
    
    if (context) {
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      message += ` (Context: ${contextStr})`;
    }
    
    message += ` | Category: ${errorCategory.category} | Recoverable: ${errorCategory.isRecoverable}`;
    
    return message;
  }

  /**
   * Enhanced error logging with categorization
   */
  static logError(
    operation: string,
    error: unknown,
    context?: Record<string, any>
  ): void {
    const standardizedMessage = this.createStandardizedErrorMessage(operation, error, context);
    const errorCategory = OCRErrorDetection.categorizeError(error);
    
    // Use appropriate log level based on recoverability
    if (errorCategory.isRecoverable) {
      console.warn('🔄 ' + standardizedMessage);
      console.warn(`💡 Recommended action: ${errorCategory.recommendedAction}`);
    } else {
      console.error('❌ ' + standardizedMessage);
      console.error(`💡 Recommended action: ${errorCategory.recommendedAction}`);
    }
    
    // Log full error stack in development
    if (error instanceof Error && error.stack) {
      console.debug('Stack trace:', error.stack);
    }
  }

  /**
   * Wraps async operations with standardized error handling
   */
  static async withErrorHandling<T>(
    operation: string,
    asyncOperation: () => Promise<T>,
    fallbackValue?: T,
    context?: Record<string, any>
  ): Promise<T> {
    try {
      return await asyncOperation();
    } catch (error) {
      this.logError(operation, error, context);
      
      const errorCategory = OCRErrorDetection.categorizeError(error);
      
      if (fallbackValue !== undefined && errorCategory.isRecoverable) {
        console.log(`🔄 Using fallback value for ${operation}`);
        return fallbackValue;
      }
      
      throw error;
    }
  }

  /**
   * Validates worker functionality before use
   */
  static validateWorker(worker: any, requiredMethods: string[] = ['recognize']): boolean {
    if (!worker) {
      return false;
    }
    
    for (const method of requiredMethods) {
      if (typeof worker[method] !== 'function') {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Creates a safe worker validation wrapper
   */
  static async safeWorkerValidation<T>(
    worker: any,
    operation: () => Promise<T>,
    requiredMethods: string[] = ['recognize'],
    context: string = 'worker operation'
  ): Promise<T> {
    return this.withErrorHandling(
      `worker validation for ${context}`,
      async () => {
        if (!this.validateWorker(worker, requiredMethods)) {
          throw new Error(`Worker is invalid or does not support required methods: ${requiredMethods.join(', ')}`);
        }
        return await operation();
      },
      undefined,
      { requiredMethods, context }
    );
  }
}

/**
 * OCR-specific error types for better type safety
 */
export class OCRError extends Error {
  public readonly category: string;
  public readonly isRecoverable: boolean;
  public readonly recommendedAction: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    originalError?: unknown,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'OCRError';
    
    const errorCategory = OCRErrorDetection.categorizeError(originalError || message);
    this.category = errorCategory.category;
    this.isRecoverable = errorCategory.isRecoverable;
    this.recommendedAction = errorCategory.recommendedAction;
    this.context = context;
    
    // Maintain stack trace
    if (originalError instanceof Error && originalError.stack) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Utility functions for common OCR error scenarios
 */
export const OCRErrorUtils = {
  /**
   * Creates a standardized fallback language array for failed language detection
   */
  createFallbackLanguages(): string[] {
    return ['eng'];
  },

  /**
   * Determines if an error should trigger worker cache clearing
   */
  shouldClearWorkerCache(error: unknown): boolean {
    return OCRErrorDetection.isWorkerValidationError(error) || 
           OCRErrorDetection.isWorkerLifecycleError(error);
  },

  /**
   * Determines if an error should trigger CDN fallback
   */
  shouldUseCDNFallback(error: unknown): boolean {
    return OCRErrorDetection.isResourceLoadingError(error) ||
           OCRErrorDetection.isWorkerLifecycleError(error);
  },

  /**
   * Creates a timeout promise for worker operations
   */
  createTimeoutPromise<T>(timeoutMs: number, operationName: string): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${operationName} timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    );
  }
};