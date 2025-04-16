import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary component to catch JavaScript errors anywhere in the child component tree,
 * log those errors, and display a fallback UI instead of the component tree that crashed.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  /**
   * Static method to derive state from error
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  /**
   * Lifecycle method called when an error is caught
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to the console
    console.error("Error caught by ErrorBoundary:", error);
    console.error("Component stack:", errorInfo.componentStack);

    // Update state with error info
    this.setState({ errorInfo });

    // If error is related to Supabase, try to refresh session
    if (
      error.message?.includes("supabase") ||
      error.message?.includes("auth") ||
      error.message?.includes("token")
    ) {
      // Try to refresh page after a delay
      setTimeout(() => {
        this.resetErrorBoundary();
      }, 5000);
    }
  }

  /**
   * Reset the error state to allow retry
   */
  resetErrorBoundary = () => {
    // Call onReset props if provided
    if (this.props.onReset) {
      this.props.onReset();
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[200px] p-6 rounded-lg border border-red-300 bg-white text-red-900">
            <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
            <p className="mb-4 text-center">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <div className="flex gap-4">
              <Button onClick={this.resetErrorBoundary} variant="secondary">
                Try again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Refresh page
              </Button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
