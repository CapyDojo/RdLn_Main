/**
 * PHASE 2: Error Boundary Component
 * React Error Boundary with integrated centralized error handling
 * 
 * SSMR Implementation:
 * - Safe: Optional wrapper, doesn't break existing functionality
 * - Step-by-step: Can be applied to individual components progressively
 * - Modular: Self-contained error boundary logic
 * - Reversible: Easy to remove if needed
 */

import React, { Component, ReactNode } from 'react';
import { ErrorFactory, ErrorManager, ErrorCategory, AppError } from '../utils/errorHandling';
import { BaseComponentProps } from '../types/components';

interface ErrorBoundaryProps extends BaseComponentProps {
  children: ReactNode;
  fallback?: (error: AppError, resetError: () => void) => ReactNode;
  onError?: (error: AppError) => void;
  category?: ErrorCategory;
  userMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    // This method is called when an error is thrown in a child component
    return { hasError: true, error: null }; // We'll set the error in componentDidCatch
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Create standardized error
    const appError = ErrorFactory.fromJavaScriptError(
      error,
      this.props.category || ErrorCategory.UNEXPECTED,
      this.props.userMessage || 'A component error occurred. Please refresh the page.',
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name
      }
    );

    // Add to error manager
    ErrorManager.addError(appError);

    // Update state with the app error
    this.setState({ error: appError });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(appError);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, className, style } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.resetError);
      }

      // Default error UI
      return (
        <div
          className={`error-boundary ${className || ''}`.trim()}
          style={{
            padding: '20px',
            margin: '10px',
            border: '1px solid #ff6b6b',
            borderRadius: '8px',
            backgroundColor: '#ffe0e0',
            color: '#d63031',
            ...style
          }}
        >
          <h3 style={{ margin: '0 0 10px 0', color: '#d63031' }}>
            Something went wrong
          </h3>
          <p style={{ margin: '0 0 15px 0' }}>
            {error.userMessage}
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={this.resetError}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#d63031',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Try Again
            </button>
            {error.retry && (
              <button
                onClick={() => {
                  if (error.retry) {
                    error.retry();
                    this.resetError();
                  }
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d63031',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  color: '#d63031',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Retry Operation
              </button>
            )}
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '15px' }}>
              <summary style={{ cursor: 'pointer', color: '#666' }}>
                Technical Details (Development)
              </summary>
              <pre
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#495057',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}
              >
                Error ID: {error.id}
                Category: {error.category}
                Severity: {error.severity}
                Message: {error.message}
                {error.stack && `\nStack: ${error.stack}`}
                {error.context && `\nContext: ${JSON.stringify(error.context, null, 2)}`}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return children;
  }
}

// Functional Error Boundary Hook (alternative approach)
export function useErrorBoundary() {
  const [error, setError] = React.useState<AppError | null>(null);

  const captureError = React.useCallback((error: Error, category?: ErrorCategory, userMessage?: string) => {
    const appError = ErrorFactory.fromJavaScriptError(
      error,
      category || ErrorCategory.UNEXPECTED,
      userMessage || 'An error occurred'
    );
    
    ErrorManager.addError(appError);
    setError(appError);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw new Error(error.message);
    }
  }, [error]);

  return { captureError, resetError };
}

export default ErrorBoundary;
