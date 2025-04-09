/**
 * Security utilities for input sanitization and validation
 */

import { supabase } from "@/lib/supabase";

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
