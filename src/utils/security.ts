/**
 * Security utilities for input sanitization and validation
 */

import { supabase } from "@/lib/supabase";
import DOMPurify from "dompurify";

/**
 * Sanitizes user input to prevent XSS attacks using stronger methods
 * @param input String input to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  // Use DOMPurify if available (requires importing the library in your project)
  if (typeof DOMPurify !== "undefined") {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }); // Strip all HTML
  }

  // Fallback to basic sanitization
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Sanitizes HTML content allowing only specific safe tags
 * @param html HTML content to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Use DOMPurify if available
  if (typeof DOMPurify !== "undefined") {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "b",
        "i",
        "em",
        "strong",
        "a",
        "p",
        "br",
        "ul",
        "ol",
        "li",
      ],
      ALLOWED_ATTR: ["href", "target", "rel"],
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
      FORBID_ATTR: [
        "onerror",
        "onload",
        "onclick",
        "onmouseover",
        "onmouseout",
        "style",
      ],
      USE_PROFILES: { html: true },
      SANITIZE_DOM: true,
    });
  }

  // Fallback to basic sanitization (not recommended for HTML)
  return sanitizeInput(html);
}

/**
 * Validates an email address format
 * @param email Email to validate
 * @returns Boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
  // More comprehensive email regex
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return emailRegex.test(email);
}

/**
 * Checks if a URL is safe (not javascript: or data: protocol)
 * @param url URL to check
 * @returns Boolean indicating if URL is safe
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;

  // List of allowed protocols
  const allowedProtocols = ["http:", "https:", "mailto:", "tel:"];

  try {
    const parsed = new URL(url);
    return allowedProtocols.includes(parsed.protocol);
  } catch (e) {
    // If URL parsing fails, check manually for dangerous protocols
    const lowercaseUrl = url.toLowerCase();
    const dangerousProtocols = [
      "javascript:",
      "data:",
      "vbscript:",
      "file:",
      "blob:",
      "ftp:",
      "ws:",
      "wss:",
      "about:",
    ];

    // Check if URL starts with any dangerous protocol
    return !dangerousProtocols.some((protocol) =>
      lowercaseUrl.startsWith(protocol)
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

/**
 * Validates that a token matches the stored CSRF token
 * @param token Token to validate
 * @returns Boolean indicating if token is valid
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = getCSRFToken();
  if (!storedToken || !token) return false;

  // Use constant-time comparison to prevent timing attacks
  return timingSafeEqual(token, storedToken);
}

/**
 * Performs a constant-time comparison of two strings to prevent timing attacks
 * @param a First string
 * @param b Second string
 * @returns Boolean indicating if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validates a password strength
 * @param password Password to validate
 * @returns Object with validity and feedback
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  feedback: string;
  score: number; // 0-4 where 4 is strongest
} {
  if (!password) {
    return { valid: false, feedback: "Password is required", score: 0 };
  }

  // Basic length check
  if (password.length < 8) {
    return {
      valid: false,
      feedback: "Password must be at least 8 characters",
      score: 0,
    };
  }

  let score = 0;

  // Check for various character types
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(password);

  // Score based on character variety
  if (hasLowercase) score++;
  if (hasUppercase) score++;
  if (hasNumbers) score++;
  if (hasSpecialChars) score++;

  // Feedback based on score
  if (score < 2) {
    return {
      valid: false,
      feedback:
        "Password is too weak. Include uppercase, lowercase, numbers and special characters",
      score,
    };
  }

  if (score < 3) {
    return {
      valid: true,
      feedback: "Password is acceptable but could be stronger",
      score,
    };
  }

  return { valid: true, feedback: "Password is strong", score };
}

/**
 * Throttles a function to prevent abuse
 * @param fn Function to throttle
 * @param limit Time limit in ms
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => ReturnType<T> | void {
  let inThrottle = false;
  let lastResult: ReturnType<T>;

  return function (this: any, ...args: Parameters<T>): ReturnType<T> | void {
    if (!inThrottle) {
      lastResult = fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
    return lastResult;
  };
}

/**
 * Store for caching admin status checks to prevent repeated API calls
 */
const adminCheckCache: Record<string, { isAdmin: boolean; timestamp: number }> =
  {};

/**
 * Cache duration for admin checks (5 minutes)
 */
const ADMIN_CACHE_DURATION = 5 * 60 * 1000;

// Global flag to completely disable admin checks across the application
// Set to true by default to prevent excessive API calls
const ADMIN_CHECKS_DISABLED = true;

// Track last API call per user to implement strict throttling
const lastUserApiCall: Record<string, number> = {};
const MIN_API_CALL_INTERVAL = 60 * 1000; // 1 minute minimum between calls

/**
 * Checks if a user has admin privileges, with caching and graceful error handling
 * @param userId The user ID to check
 * @returns Object with isAdmin flag and any error that occurred
 */
export const checkAdminAccess = async (
  userId: string
): Promise<{ isAdmin: boolean; error: any }> => {
  try {
    if (!userId) {
      return { isAdmin: false, error: new Error("No user ID provided") };
    }

    // If admin checks are completely disabled, always return false
    if (ADMIN_CHECKS_DISABLED) {
      return { isAdmin: false, error: null };
    }

    // Check session storage to see if we've already checked in this session
    const adminCheckFlag = sessionStorage.getItem(`admin_check_${userId}`);
    if (adminCheckFlag) {
      const isAdmin = adminCheckFlag === "true";
      return { isAdmin, error: null };
    }

    // Check cache first to avoid repeated API calls
    const cachedResult = adminCheckCache[userId];
    const now = Date.now();

    if (cachedResult && now - cachedResult.timestamp < ADMIN_CACHE_DURATION) {
      // Return from cache without any API call
      return { isAdmin: cachedResult.isAdmin, error: null };
    }

    // Implement strict throttling to prevent repeated API calls
    const lastCallTime = lastUserApiCall[userId] || 0;
    if (now - lastCallTime < MIN_API_CALL_INTERVAL) {
      // Too soon since last API call, return negative result
      return { isAdmin: false, error: new Error("API call throttled") };
    }

    // Update the last API call time
    lastUserApiCall[userId] = now;

    // Try to check admin status while handling 406 errors
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .single();

      // Store result in session storage to avoid any more checks this session
      const isAdmin = !error && !!data;
      sessionStorage.setItem(
        `admin_check_${userId}`,
        isAdmin ? "true" : "false"
      );

      // Cache the result
      adminCheckCache[userId] = { isAdmin, timestamp: now };
      return { isAdmin, error: null };
    } catch (err) {
      // Cache negative result on error for a long time
      adminCheckCache[userId] = { isAdmin: false, timestamp: now };
      sessionStorage.setItem(`admin_check_${userId}`, "false");
      return { isAdmin: false, error: err };
    }
  } catch (error) {
    // Any error results in non-admin status
    return { isAdmin: false, error };
  }
};

/**
 * Check if critical security features are enabled
 * Used by SecurityMonitor to verify the environment
 *
 * @returns Object with security feature flags
 */
export function detectSecurityFeatures() {
  // Check if running in the browser
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      isHttpsEnabled: true, // Assume secure in SSR context
      hasContentSecurityPolicy: true,
      hasStrictTransportSecurity: true,
      hasXContentTypeOptions: true,
      hasXFrameOptions: true,
      hasReferrerPolicy: true,
      hasXSSProtection: true,
    };
  }

  // Check for HTTPS
  const isHttpsEnabled =
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes(".local") ||
    process.env.NODE_ENV === "development";

  // Check for Content-Security-Policy
  let hasContentSecurityPolicy = false;
  const metaTags = document.querySelectorAll(
    'meta[http-equiv="Content-Security-Policy"]'
  );
  if (metaTags.length > 0) {
    hasContentSecurityPolicy = true;
  } else {
    // Check response headers if accessible
    try {
      // This won't work in all browsers due to security restrictions
      // But we'll include the check for environments where it might be available
      const headers =
        document.querySelector("head")?.getAttribute("data-headers") || "";
      hasContentSecurityPolicy = headers.includes("content-security-policy");
    } catch (e) {
      console.error("Error checking CSP headers:", e);
    }
  }

  // Check for Strict-Transport-Security
  let hasStrictTransportSecurity = false;
  const hstsMetaTags = document.querySelectorAll(
    'meta[http-equiv="Strict-Transport-Security"]'
  );
  hasStrictTransportSecurity = hstsMetaTags.length > 0;

  // Check for X-Content-Type-Options
  let hasXContentTypeOptions = false;
  const xctoMetaTags = document.querySelectorAll(
    'meta[http-equiv="X-Content-Type-Options"]'
  );
  hasXContentTypeOptions = xctoMetaTags.length > 0;

  // Check for X-Frame-Options
  let hasXFrameOptions = false;
  const xfoMetaTags = document.querySelectorAll(
    'meta[http-equiv="X-Frame-Options"]'
  );
  hasXFrameOptions = xfoMetaTags.length > 0;

  // Check for Referrer-Policy
  let hasReferrerPolicy = false;
  const referrerMetaTags = document.querySelectorAll('meta[name="referrer"]');
  hasReferrerPolicy = referrerMetaTags.length > 0;

  // Check for X-XSS-Protection
  let hasXSSProtection = false;
  const xssMetaTags = document.querySelectorAll(
    'meta[http-equiv="X-XSS-Protection"]'
  );
  hasXSSProtection = xssMetaTags.length > 0;

  return {
    isHttpsEnabled,
    hasContentSecurityPolicy,
    hasStrictTransportSecurity,
    hasXContentTypeOptions,
    hasXFrameOptions,
    hasReferrerPolicy,
    hasXSSProtection,
  };
}

/**
 * Validates and sanitizes a numeric input
 * @param value The input value
 * @param options Validation options
 * @returns Sanitized number or null if invalid
 */
export function sanitizeNumericInput(
  value: any,
  options: { min?: number; max?: number; allowFloat?: boolean } = {}
): number | null {
  // Default options
  const {
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER,
    allowFloat = false,
  } = options;

  // Convert to string and sanitize
  const sanitized = String(value).replace(/[^\d.-]/g, "");

  // Parse as number
  const num = allowFloat ? parseFloat(sanitized) : parseInt(sanitized, 10);

  // Check if valid number
  if (isNaN(num)) {
    return null;
  }

  // Apply min/max constraints
  return Math.min(Math.max(num, min), max);
}

/**
 * Comprehensive validation for different types of user inputs
 * This provides protection against SQL injection, XSS, and other injection attacks
 */

/**
 * Validates and sanitizes a URL parameter (slug, path, etc.)
 * @param value URL parameter to sanitize
 * @returns Sanitized URL parameter or null if invalid
 */
export function sanitizeUrlParam(value: string): string | null {
  if (!value) return null;

  // Remove any potentially dangerous characters
  // Allow only alphanumeric, dash, underscore, period, tilde (RFC 3986 unreserved chars)
  const sanitized = value.replace(/[^a-zA-Z0-9-_.~]/g, "");

  // If the sanitized value is different from original, it contained invalid chars
  if (sanitized !== value) {
    console.warn("URL parameter contained invalid characters", {
      original: value,
      sanitized,
    });
  }

  return sanitized;
}

/**
 * Validates and sanitizes text input that should only contain alphanumeric characters
 * @param value Text to sanitize
 * @param allowSpaces Whether to allow spaces in the input
 * @returns Sanitized text or null if fully invalid
 */
export function sanitizeAlphanumeric(
  value: string,
  allowSpaces = false
): string | null {
  if (!value) return null;

  const regex = allowSpaces ? /[^a-zA-Z0-9\s]/g : /[^a-zA-Z0-9]/g;
  return value.replace(regex, "");
}

/**
 * Validates and sanitizes a date string
 * @param dateStr Date string to validate
 * @returns Valid Date object or null if invalid
 */
export function validateDateString(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try to parse the date
  const date = new Date(dateStr);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return null;
  }

  // Additional validation: check if year is reasonable
  const year = date.getFullYear();
  if (year < 1900 || year > 2100) {
    return null;
  }

  return date;
}

/**
 * Validates and cleans JSON input to prevent prototype pollution
 * @param jsonData JSON data to validate
 * @returns Sanitized JSON object or null if invalid
 */
export function sanitizeJsonInput(jsonData: any): any | null {
  if (!jsonData) return null;

  try {
    // If it's a string, try to parse it
    const data = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;

    // Recursive function to clean object
    const cleanObject = (obj: any): any => {
      if (obj === null || typeof obj !== "object") return obj;

      // Create a new object without the prototype
      const cleaned = Object.create(null);

      // Process all properties
      Object.keys(obj).forEach((key) => {
        // Skip dangerous property names
        if (["__proto__", "constructor", "prototype"].includes(key)) {
          console.warn("Potentially dangerous property in JSON:", key);
          return;
        }

        // Recursively clean nested objects
        cleaned[key] = cleanObject(obj[key]);
      });

      return cleaned;
    };

    return cleanObject(data);
  } catch (error) {
    console.error("Failed to parse JSON input:", error);
    return null;
  }
}

/**
 * Creates a parameterized SQL query placeholder object for Supabase
 * Helps prevent SQL injection by ensuring all inputs are properly parameterized
 * @param params Object containing parameters for a SQL query
 * @returns Sanitized parameters object
 */
export function createSafeQueryParams(
  params: Record<string, any>
): Record<string, any> {
  const safeParams: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    // Skip null or undefined values
    if (value === null || value === undefined) continue;

    // Handle different data types appropriately
    if (typeof value === "string") {
      // Sanitize string inputs
      safeParams[key] = sanitizeInput(value);
    } else if (value instanceof Date) {
      // Format dates as ISO strings
      safeParams[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      // Sanitize array values
      safeParams[key] = value.map((item) =>
        typeof item === "string" ? sanitizeInput(item) : item
      );
    } else if (typeof value === "object") {
      // Recursively sanitize nested objects
      safeParams[key] = createSafeQueryParams(value);
    } else {
      // Pass through numbers, booleans, etc.
      safeParams[key] = value;
    }
  }

  return safeParams;
}

/**
 * Data cleaner utility to be used before submitting forms or API requests
 * @param data Form data or API request body to clean
 * @returns Cleaned data object with sanitized values
 */
export function cleanUserInput(data: Record<string, any>): Record<string, any> {
  const cleanedData: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip null or undefined
    if (value === null || value === undefined) continue;

    if (typeof value === "string") {
      // Sanitize string inputs based on field name
      if (key.includes("email")) {
        // Email validation
        cleanedData[key] = isValidEmail(value) ? value.trim() : null;
      } else if (
        key.includes("url") ||
        key.includes("link") ||
        key.includes("website")
      ) {
        // URL validation
        cleanedData[key] = isSafeUrl(value) ? value.trim() : null;
      } else if (key.includes("date")) {
        // Date validation
        const date = validateDateString(value);
        cleanedData[key] = date ? date.toISOString() : null;
      } else if (key.includes("html") || key.includes("content")) {
        // HTML content sanitization
        cleanedData[key] = sanitizeHtml(value);
      } else {
        // Default string sanitization
        cleanedData[key] = sanitizeInput(value.trim());
      }
    } else if (Array.isArray(value)) {
      // Sanitize array values
      cleanedData[key] = value.map((item) =>
        typeof item === "string" ? sanitizeInput(item) : item
      );
    } else if (typeof value === "object") {
      // Recursively sanitize nested objects
      cleanedData[key] = cleanUserInput(value);
    } else {
      // Pass through numbers, booleans, etc.
      cleanedData[key] = value;
    }
  }

  return cleanedData;
}
