/**
 * Utility for consistent logging that can be easily disabled in production
 */
export const logger = {
  /**
   * Log an error message
   * @param message The error message
   * @param error The error object (optional)
   */
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[ERROR] ${message}`, error);
    }
    // In production, this could send to an error monitoring service
    // Example: errorMonitoringService.captureException(error);
  },

  /**
   * Log an informational message
   * @param message The info message
   * @param data Additional data (optional)
   */
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[INFO] ${message}`, data);
    }
  },

  /**
   * Log a warning message
   * @param message The warning message
   * @param data Additional data (optional)
   */
  warn: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[WARN] ${message}`, data);
    }
  },

  /**
   * Log a debug message (only in development)
   * @param message The debug message
   * @param data Additional data (optional)
   */
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, data);
    }
  },
};
