import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface SecurityEvent {
  type: string;
  timestamp: string;
  details: Record<string, any>;
}

// Maximum login attempts before temporary lockout
const MAX_LOGIN_ATTEMPTS = 5;
// Lockout duration in milliseconds (15 minutes)
const LOCKOUT_DURATION = 15 * 60 * 1000;

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

  // Log security events to console in development and to secure endpoint in production
  const logSecurityEvent = (type: string, details: Record<string, any>) => {
    const event: SecurityEvent = {
      type,
      timestamp: new Date().toISOString(),
      details,
    };

    // Add to local state
    setSecurityEvents((prev) => [...prev, event]);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.warn("Security Event:", event);
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

  // Monitor for suspicious activities when user is logged in
  useEffect(() => {
    if (!user) return;

    // Check if user is admin (for potential additional security monitoring)
    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .single();

        if (!error && data) {
          // If user is admin, we could enable additional monitoring
          // or disable certain restrictions
          console.log(
            "Admin user detected, enabling advanced monitoring options"
          );
        }
      } catch (err) {
        console.error("Error checking admin status:", err);
      }
    };

    checkAdminStatus();

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
            userId: user.id,
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

    return () => {
      window.removeEventListener("popstate", handleNavigation);
    };
  }, [user]);

  // Monitor for XSS attempts in URL
  useEffect(() => {
    const checkUrl = () => {
      const url = window.location.href;
      const suspiciousPatterns = [
        /<script>/i,
        /javascript:/i,
        /on\w+=/i, // onclick=, onload=, etc.
        /alert\(/i,
        /eval\(/i,
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
          logSecurityEvent("xss-attempt", {
            url,
            pattern: pattern.toString(),
          });

          // Optionally redirect to a safe page
          // window.location.href = '/';
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
