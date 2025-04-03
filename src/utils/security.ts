/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input String input to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  // Replace potentially dangerous characters
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validates an email address format
 * @param email Email to validate
 * @returns Boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Checks if a URL is safe (not javascript: or data: protocol)
 * @param url URL to check
 * @returns Boolean indicating if URL is safe
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return !["javascript:", "data:", "vbscript:"].includes(parsed.protocol);
  } catch (e) {
    // If URL parsing fails, check manually for dangerous protocols
    const lowercaseUrl = url.toLowerCase();
    return (
      !lowercaseUrl.startsWith("javascript:") &&
      !lowercaseUrl.startsWith("data:") &&
      !lowercaseUrl.startsWith("vbscript:")
    );
  }
}

/**
 * Generates a secure random token for CSRF protection
 * @returns Random token string
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Store CSRF token in session storage
 */
export function storeCSRFToken(token: string): void {
  sessionStorage.setItem("csrf_token", token);
}

/**
 * Retrieve CSRF token from session storage
 */
export function getCSRFToken(): string | null {
  return sessionStorage.getItem("csrf_token");
}
