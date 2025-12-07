import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle, RefreshCw, Home, AlertTriangle } from "lucide-react";

//=============================================================================
// TYPES
//=============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  maxErrorCount?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number;
}

/**
 * ErrorBoundary Component
 *
 * A robust error boundary that catches JavaScript errors anywhere in the component tree,
 * logs detailed error information, and displays a user-friendly fallback UI.
 *
 * Features:
 * - Detailed error logging for development and production
 * - Automatic recovery attempts for certain types of errors
 * - Customizable fallback UI
 * - Analytics integration via onError prop
 * - Error count tracking to prevent infinite error loops
 * - Progressive recovery strategy based on error frequency and type
 * - Comprehensive error detection and reporting
 */
export class ErrorBoundary extends Component<Props, State> {
  // Specify default props
  static defaultProps = {
    showDetails: false,
    maxErrorCount: 3,
  };

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorCount: 0,
    lastErrorTime: 0,
  };

  /**
   * Static method to derive state from error
   * Updates state so the next render will show the fallback UI
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now(),
    };
  }

  /**
   * Lifecycle method called when an error is caught
   * Handles error logging and triggers any error callbacks
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Create a timestamp for the error
    const timestamp = new Date().toISOString();
    const browserInfo = this.getBrowserInfo();

    // Update state with error info and increment error count
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log detailed error information
    console.group(`Error caught by ErrorBoundary (${timestamp})`);
    console.error("Error:", error);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("Component stack:", errorInfo.componentStack);
    console.error("URL:", window.location.href);
    console.error("Browser:", browserInfo);
    console.groupEnd();

    // Call onError prop if provided (useful for error analytics)
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (callbackError) {
        console.error("Error in onError callback:", callbackError);
      }
    }

    // Attempt to recover automatically from certain types of errors
    this.attemptAutoRecovery(error);
  }

  /**
   * Get browser and environment information for better error context
   */
  getBrowserInfo = () => {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      url: window.location.href,
      referrer: document.referrer,
    };
  };

  /**
   * Attempt to automatically recover from certain types of errors
   * Uses a progressive strategy based on error type and frequency
   */
  attemptAutoRecovery = (error: Error) => {
    const { maxErrorCount = 3 } = this.props;

    // Prevent too many recovery attempts
    if (this.state.errorCount > maxErrorCount) {
      console.warn(
        "Too many errors encountered, stopping auto-recovery attempts"
      );
      return;
    }

    // Determine if this is a network-related error
    const isNetworkError =
      error.message?.includes("supabase") ||
      error.message?.includes("auth") ||
      error.message?.includes("token") ||
      error.message?.includes("network") ||
      error.message?.includes("fetch") ||
      error.message?.includes("timeout") ||
      error.message?.includes("connection") ||
      error.name === "ChunkLoadError";

    // Determine if this is a rendering/state error
    const isRenderError =
      error.message?.includes("render") ||
      error.message?.includes("state") ||
      error.message?.includes("props") ||
      error.message?.includes("children") ||
      this.state.errorInfo?.componentStack?.includes("render");

    if (isNetworkError) {
      console.info("Attempting auto-recovery for network-related error");

      // Network errors often resolve with a retry after a short delay
      const retryDelay = Math.min(2000 * this.state.errorCount, 10000);
      setTimeout(() => {
        this.resetErrorBoundary();
      }, retryDelay);
    } else if (isRenderError) {
      console.info("Attempting auto-recovery for rendering error");

      // For render errors, we might need to clear local storage or session data
      // that could be causing corruption
      if (this.state.errorCount > 2) {
        try {
          // Only clear job-related cache data, not auth tokens
          const keysToPreserve = ["sb-", "supabase-auth"];
          Object.keys(localStorage).forEach((key) => {
            const shouldPreserve = keysToPreserve.some((prefix) =>
              key.startsWith(prefix)
            );

            if (!shouldPreserve && key.includes("job")) {
              localStorage.removeItem(key);
            }
          });
        } catch (e) {
          console.error("Failed to clear localStorage:", e);
        }
      }

      // Try recovery after a longer delay for render errors
      setTimeout(() => {
        this.resetErrorBoundary();
      }, 3000);
    } else {
      // For other errors, attempt recovery with exponential backoff
      if (this.state.errorCount <= 2) {
        const backoffTime = Math.pow(2, this.state.errorCount) * 1000;
        setTimeout(() => {
          this.resetErrorBoundary();
        }, backoffTime);
      }
    }
  };

  /**
   * Reset the error state to allow retry
   */
  resetErrorBoundary = () => {
    // Call onReset props if provided
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (resetError) {
        console.error("Error in onReset callback:", resetError);
      }
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Navigate to the home page as a last resort recovery method
   */
  navigateToHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Determine if we're experiencing frequent errors
      const frequentErrors = this.state.errorCount > 2;
      const timeSinceLastError = Date.now() - this.state.lastErrorTime;
      const isRecoverable =
        timeSinceLastError > 30000 || this.state.errorCount <= 2;

      // Default fallback UI with error details
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 rounded-lg border border-red-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-lg m-4">
          <Alert variant="destructive" className="mb-6 max-w-lg">
            <AlertCircle className="h-5 w-5 mr-2" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              {frequentErrors
                ? "We're experiencing persistent issues. Please try refreshing or coming back later."
                : "We've encountered an unexpected error. Please try again or refresh the page."}
            </AlertDescription>
          </Alert>

          <div className="mb-4 text-center max-w-md">
            <p className="text-red-600 dark:text-red-400 mb-2">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>

            {/* Show technical details in development or if showDetails is true */}
            {(process.env.NODE_ENV === "development" ||
              this.props.showDetails) &&
              this.state.errorInfo && (
                <details className="mt-4 text-left text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <summary className="cursor-pointer p-1">
                    Technical Details
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-[300px] p-2">
                    {this.state.error?.stack}
                  </pre>
                  <p className="mt-2 font-bold">Component Stack:</p>
                  <pre className="whitespace-pre-wrap overflow-auto max-h-[200px] p-2">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={this.resetErrorBoundary}
              variant="default"
              className="flex items-center gap-2"
              disabled={!isRecoverable}
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>

            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>

            <Button
              onClick={this.navigateToHome}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go to Home
            </Button>
          </div>

          {frequentErrors && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md max-w-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">
                    Persistent Issues Detected
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                    We've detected multiple errors. Here are some solutions to
                    try:
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1.5 list-disc pl-5">
                    <li>Clear your browser cache and cookies</li>
                    <li>Update your browser to the latest version</li>
                    <li>Try using a different browser</li>
                    <li>Check your internet connection</li>
                    <li>If the problem persists, please contact support</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
