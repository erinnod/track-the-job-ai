import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { checkAdminAccess, detectSecurityFeatures } from "@/utils/security";

interface SecurityEvent {
  type: string;
  timestamp: string;
  details: Record<string, any>;
}

// Maximum login attempts before temporary lockout
const MAX_LOGIN_ATTEMPTS = 5;
// Lockout duration in milliseconds (15 minutes)
const LOCKOUT_DURATION = 15 * 60 * 1000;

// Global flag to disable admin checking after repeated issues
// This prevents unnecessary API calls if the feature is clearly not working
let globalAdminCheckDisabled = false;

// Keys to ignore when checking for sensitive data in localStorage during development
const IGNORED_SENSITIVE_KEYS = [
  "next:router:",
  "cached_jobs",
  "cached_jobs_timestamp",
  "supabase.auth.token",
  "token",
  "auth",
];

/**
 * SecurityMonitor - Invisible component that monitors for security events
 * This component doesn't render anything visible but adds security monitoring
 */
export const SecurityMonitor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const failedLoginAttempts = useRef<Record<string, number>>({});
  const lockedIPs = useRef<Record<string, number>>({});
  const securityChecksComplete = useRef<boolean>(false);

  // Log security events to console in development and to secure endpoint in production
  const logSecurityEvent = (type: string, details: Record<string, any>) => {
    // Skip excessive logging to reduce console clutter
    if (type === "admin-check" || type === "admin-check-error") {
      return;
    }

    const event: SecurityEvent = {
      type,
      timestamp: new Date().toISOString(),
      details,
    };

    // Add to local state
    setSecurityEvents((prev) => [...prev, event]);

    // Log to console in development - but only for important events
    if (process.env.NODE_ENV === "development") {
      // Only log certain events to avoid spamming the console
      if (
        [
          "login-failure",
          "account-lockout",
          "xss-attempt",
          // Don't log "security-misconfiguration" in development since we expect some of these
        ].includes(type)
      ) {
        console.warn("Security Event:", event);
      }
    }

    // In production, log directly to Supabase
    if (process.env.NODE_ENV === "production") {
      import("@/lib/supabase")
        .then(({ supabase }) => {
          supabase
            .from("security_logs")
            .insert({
              type: event.type,
              details: event.details,
              timestamp: event.timestamp,
              ip: "client-side",
            })
            .then(({ error }) => {
              if (error) {
                console.error(
                  "Failed to log security event to Supabase:",
                  error
                );
              }
            });
        })
        .catch((err) => {
          console.error("Failed to import Supabase client:", err);
        });
    }
  };

  // Monitor for failed login attempts
  useEffect(() => {
    const handleLoginFailure = (event: CustomEvent) => {
      const ip = event.detail?.ip || "unknown";

      // Check if IP is locked
      if (lockedIPs.current[ip] && lockedIPs.current[ip] > Date.now()) {
        toast({
          title: "Account Locked",
          description: "Too many failed attempts. Please try again later.",
          variant: "destructive",
        });

        logSecurityEvent("login-during-lockout", { ip });
        return;
      }

      // Increment failed attempts
      failedLoginAttempts.current[ip] =
        (failedLoginAttempts.current[ip] || 0) + 1;

      logSecurityEvent("failed-login", {
        ip,
        email: event.detail?.email || "unknown",
        attempts: failedLoginAttempts.current[ip],
      });

      // Check for lockout threshold
      if (failedLoginAttempts.current[ip] >= MAX_LOGIN_ATTEMPTS) {
        lockedIPs.current[ip] = Date.now() + LOCKOUT_DURATION;

        // Reset counter
        failedLoginAttempts.current[ip] = 0;

        logSecurityEvent("account-lockout", { ip });

        toast({
          title: "Account Temporarily Locked",
          description:
            "Too many failed login attempts. Please try again later.",
          variant: "destructive",
        });
      }
    };

    // Listen for custom login failure events
    window.addEventListener("login-failure" as any, handleLoginFailure);

    return () => {
      window.removeEventListener("login-failure" as any, handleLoginFailure);
    };
  }, []);

  // Check for security misconfigurations on mount
  useEffect(() => {
    const checkSecurityMisconfigurations = async () => {
      if (securityChecksComplete.current) return;

      // Only run these checks once per session
      securityChecksComplete.current = true;

      try {
        // Skip detailed security checks in development mode
        if (process.env.NODE_ENV === "development") {
          return;
        }

        // 1. Check for security headers
        const securityFeatures = detectSecurityFeatures();

        // 2. Check Content-Type Mismatch
        const checkContentTypeMismatch = () => {
          const scripts = document.querySelectorAll("script");
          let foundUnsafe = false;

          scripts.forEach((script) => {
            // Check for inline scripts without nonce or integrity
            if (
              !script.src &&
              !script.hasAttribute("nonce") &&
              !script.hasAttribute("integrity")
            ) {
              foundUnsafe = true;
              logSecurityEvent("security-misconfiguration", {
                type: "inline-script-without-nonce",
                element: script.outerHTML.substring(0, 100), // Log only first 100 chars
              });
            }
          });

          return foundUnsafe;
        };

        // 3. Check for missing HTTPS
        if (
          !securityFeatures.isHttpsEnabled &&
          process.env.NODE_ENV === "production"
        ) {
          logSecurityEvent("security-misconfiguration", {
            type: "missing-https",
            url: window.location.href,
          });

          // Warn user about insecure connection
          toast({
            title: "Security Warning",
            description:
              "You are using an insecure connection. Your data may be at risk.",
            variant: "destructive",
          });
        }

        // 4. Check for missing CSP
        if (!securityFeatures.hasContentSecurityPolicy) {
          logSecurityEvent("security-misconfiguration", {
            type: "missing-csp",
          });
        }

        // 5. Check for missing HSTS
        if (
          !securityFeatures.hasStrictTransportSecurity &&
          process.env.NODE_ENV === "production"
        ) {
          logSecurityEvent("security-misconfiguration", {
            type: "missing-hsts",
          });
        }

        // 6. Check for vulnerable dependencies
        // This is a simple check that we might replace with a more robust solution
        // In production, you'd scan using tools like Snyk or Dependabot
        const checkForVulnerableDependencies = () => {
          // List of known vulnerable package versions
          // This would normally come from a security API
          const knownVulnerablePackages = [
            { name: "react", version: "<16.14.0" },
            { name: "lodash", version: "<4.17.21" },
          ];

          // In a real implementation, you'd have a way to check this
          // For this example, we'll just log it as a reminder
          logSecurityEvent("security-check", {
            type: "dependency-check-reminder",
            message: "Regular dependency scanning should be implemented",
          });
        };

        // 7. Check for insecure localStorage usage
        const checkInsecureStorage = () => {
          try {
            // Check if sensitive data is stored in localStorage
            const sensitiveKeys = [
              "password",
              "token",
              "auth",
              "key",
              "secret",
            ];
            let foundInsecure = false;

            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (!key) continue;

              // In development, ignore certain known keys that we expect to use
              if (
                process.env.NODE_ENV === "development" &&
                IGNORED_SENSITIVE_KEYS.some((ignoredKey) =>
                  key.includes(ignoredKey)
                )
              ) {
                continue;
              }

              // Check if key contains sensitive terms
              if (
                sensitiveKeys.some((term) => key.toLowerCase().includes(term))
              ) {
                // Don't log the actual value for security reasons
                foundInsecure = true;
                logSecurityEvent("security-misconfiguration", {
                  type: "insecure-storage",
                  key: key,
                });
              }
            }

            return foundInsecure;
          } catch (error) {
            console.error("Error checking storage:", error);
            return false;
          }
        };

        // Run all the checks
        const hasContentTypeMismatch = checkContentTypeMismatch();
        const hasInsecureStorage = checkInsecureStorage();
        checkForVulnerableDependencies();

        // Log an aggregate report
        const securityIssues = [];

        if (
          !securityFeatures.isHttpsEnabled &&
          process.env.NODE_ENV === "production"
        ) {
          securityIssues.push("Missing HTTPS");
        }

        if (!securityFeatures.hasContentSecurityPolicy) {
          securityIssues.push("Missing Content Security Policy");
        }

        if (
          !securityFeatures.hasStrictTransportSecurity &&
          process.env.NODE_ENV === "production"
        ) {
          securityIssues.push("Missing HTTP Strict Transport Security");
        }

        if (hasContentTypeMismatch) {
          securityIssues.push("Unsafe inline scripts detected");
        }

        if (hasInsecureStorage) {
          securityIssues.push("Sensitive data in insecure storage");
        }

        if (securityIssues.length > 0) {
          console.warn("Security misconfigurations detected:", securityIssues);

          // In production, notify administrators
          if (process.env.NODE_ENV === "production") {
            // You would implement this with your own notification system
            // For example, sending an email or Slack message
          }
        }
      } catch (error) {
        console.error("Error in security configuration check:", error);
      }
    };

    // Run the security checks after a short delay to not block rendering
    // Use a longer delay in development mode to reduce startup noise
    const timeoutDelay = process.env.NODE_ENV === "development" ? 5000 : 2000;
    const timeoutId = setTimeout(checkSecurityMisconfigurations, timeoutDelay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Monitor for suspicious activities when user is logged in
  useEffect(() => {
    if (!user) return;

    // Only continue if we have a user ID
    const userId = user.id;
    if (!userId) return;

    // Skip admin checking completely - it's not necessary for normal operation
    // and was causing excessive API calls
    // All admin checking code has been removed as it's not critical for security monitoring

    // Example: detect rapid navigation, which could indicate bot activity
    let navigationCount = 0;
    let lastNavigationTime = Date.now();

    const handleNavigation = () => {
      const now = Date.now();
      const timeDiff = now - lastNavigationTime;

      // If navigating too quickly (less than 500ms between navigations)
      if (timeDiff < 500) {
        navigationCount++;

        // If too many rapid navigations, log as suspicious
        if (navigationCount > 5) {
          logSecurityEvent("rapid-navigation", {
            userId: userId,
            count: navigationCount,
            timeWindow: "500ms",
          });

          // Reset counter
          navigationCount = 0;
        }
      } else {
        // Reset counter for normal navigation
        navigationCount = 0;
      }

      lastNavigationTime = now;
    };

    window.addEventListener("popstate", handleNavigation);

    // In development mode, skip monitoring network requests to reduce noise
    let originalFetch: typeof window.fetch | undefined;

    if (process.env.NODE_ENV === "production") {
      // Monitor for suspicious POST requests
      originalFetch = window.fetch;
      window.fetch = async function (input, init) {
        // Only monitor POST requests
        if (init && init.method === "POST") {
          try {
            // Check for suspicious payloads
            if (init.body && typeof init.body === "string") {
              const suspiciousPatterns = [
                /<script>/i,
                /javascript:/i,
                /SELECT.*FROM/i, // Potential SQL injection
                /UNION.*SELECT/i, // Potential SQL injection
                /DROP.*TABLE/i, // Potential SQL injection
                /alert\(/i,
                /eval\(/i,
              ];

              for (const pattern of suspiciousPatterns) {
                if (pattern.test(init.body)) {
                  // Get the URL safely regardless of input type
                  let urlString: string;
                  if (typeof input === "string") {
                    urlString = input;
                  } else if (input instanceof Request) {
                    urlString = input.url;
                  } else {
                    urlString = input.toString();
                  }

                  logSecurityEvent("suspicious-payload", {
                    userId: userId,
                    url: urlString,
                    pattern: pattern.toString(),
                    // Don't log the full payload for privacy
                    excerpt: init.body.substring(0, 50) + "...",
                  });
                  break;
                }
              }
            }
          } catch (error) {
            console.error("Error checking fetch payload:", error);
          }
        }

        // Proceed with the original fetch
        return originalFetch.apply(window, [input, init]);
      };
    }

    return () => {
      window.removeEventListener("popstate", handleNavigation);
      // Restore original fetch if we modified it
      if (originalFetch) {
        window.fetch = originalFetch;
      }
    };
  }, [user?.id]); // Only depend on user ID, not the full user object

  // Monitor for XSS attempts in URL
  useEffect(() => {
    const checkUrl = () => {
      // Skip this check in development to reduce noise
      if (process.env.NODE_ENV === "development") {
        return;
      }

      const url = window.location.href;
      const suspiciousPatterns = [
        /<script>/i,
        /javascript:/i,
        /on\w+=/i, // onclick=, onload=, etc.
        /alert\(/i,
        /eval\(/i,
        /document\.cookie/i,
        /fetch\(/i,
        /axios\(/i,
        /\$\(/i, // jQuery selector
        /\$\.get/i,
        /\$\.post/i,
        /\.innerHTML/i,
        /\.outerHTML/i,
        /document\.write/i,
        /document\.location/i,
        /window\.location/i,
        /document\.URL/i,
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
          logSecurityEvent("xss-attempt", {
            url,
            pattern: pattern.toString(),
          });

          // Provide a visible warning to the user
          toast({
            title: "Security Warning",
            description:
              "Potentially malicious URL detected. The page may be redirected.",
            variant: "destructive",
          });

          // Optionally redirect to a safe page after a short delay
          setTimeout(() => {
            // Only redirect if still on the suspicious URL
            if (pattern.test(window.location.href)) {
              window.location.href = "/";
            }
          }, 3000);

          break;
        }
      }
    };

    // Check on component mount and URL changes
    checkUrl();
    window.addEventListener("popstate", checkUrl);

    return () => {
      window.removeEventListener("popstate", checkUrl);
    };
  }, []);

  return null; // This component doesn't render anything
};
