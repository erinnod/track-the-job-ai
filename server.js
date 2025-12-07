/**
 * JobTrakr API Server
 *
 * This server provides the backend API for the JobTrakr application, including:
 * - Static file serving for the frontend
 * - Authentication and authorization middleware
 * - Security headers and protection
 * - API routes for job application management
 * - Integration with AI services
 *
 * It uses Express for routing and middleware management and
 * Supabase for authentication and database operations.
 */

//=============================================================================
// DEPENDENCIES AND CONFIGURATION
//=============================================================================

// Import dependencies
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { createClient } = require("@supabase/supabase-js");
const app = express();
const PORT = process.env.PORT || 3000;

// Load environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""; // Use environment variables for API keys

const getSupabaseClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase credentials are not configured");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

//=============================================================================
// SECURITY MIDDLEWARE CONFIGURATION
//=============================================================================

/**
 * Configure rate limiting to prevent abuse
 *
 * We use different rate limits for different types of requests:
 * - Global limit for all requests
 * - Stricter limits for authentication endpoints
 * - Dedicated limits for AI API calls
 */

// Configure global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
});

// More strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 login requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many authentication attempts, please try again later.",
  },
});

// Add a stricter rate limit for AI API calls
const aiApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 AI requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many AI requests, please try again later.",
  },
});

// Apply global rate limiting to all requests
app.use(globalLimiter);

// Set up middleware
app.use(express.json({ limit: "1mb" })); // Add size limit to prevent JSON payload attacks
app.use(cookieParser());

/**
 * Security headers middleware
 *
 * Adds various security headers to all responses to protect against common attacks
 */
app.use((req, res, next) => {
  // Add standard security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy (formerly Feature-Policy)
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()"
  );

  // Cross-Origin headers for additional protection
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

  // Content Security Policy
  const isDev = process.env.NODE_ENV === "development";
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://*.jobtrakr.co.uk",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.jobtrakr.co.uk https://*.jobtrakr.co.uk https://api.openai.com https://generativelanguage.googleapis.com",
    "frame-src 'self' https://*.supabase.co",
    "worker-src 'self' blob:",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  // Add localhost exceptions for development
  if (isDev) {
    cspDirectives.push(
      "connect-src 'self' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*"
    );
  }

  res.setHeader("Content-Security-Policy", cspDirectives.join("; "));

  next();
});

//=============================================================================
// AUTHENTICATION AND AUTHORIZATION
//=============================================================================

/**
 * Authentication middleware
 *
 * Verifies the user's authentication token from cookies or auth header
 * and attaches the user object to the request if successful.
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Get token from cookies or auth header
    const token =
      req.cookies?.["jobtrakr-auth-token"] ||
      req.cookies?.["sb-kffbwemulhhsyaiooabh-auth-token"] ||
      req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const supabase = getSupabaseClient();

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid authentication" });
    }

    // Add user to request object for later use
    req.user = data.user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Role-based authorization middleware factory
 *
 * Creates middleware that checks if the authenticated user has
 * one of the allowed roles for the requested resource.
 *
 * @param {string[]} allowedRoles - Array of role names that have access
 * @returns {Function} Middleware function to use in route definitions
 */
const authorizeRoles = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Authentication required" });
      }

      const supabase = getSupabaseClient();

      // Get user role from profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", req.user.id)
        .single();

      if (error || !data) {
        return res.status(403).json({
          success: false,
          message: "Forbidden - unable to verify role",
        });
      }

      const userRole = data.role || "user";

      // Check if user's role is in the allowed roles list
      if (allowedRoles.includes(userRole)) {
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: "Forbidden - insufficient permissions",
        });
      }
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  };
};

//=============================================================================
// STATIC FILES AND CONTENT SECURITY POLICY
//=============================================================================

/**
 * Configure static file serving
 *
 * Serves the frontend application files from the 'dist' directory
 * with appropriate caching headers
 */
app.use(
  express.static(path.join(__dirname, "dist"), {
    maxAge: "1d", // Cache for 1 day
    setHeaders: (res, path) => {
      if (path.endsWith(".html")) {
        // Don't cache HTML files
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

/**
 * Content Security Policy middleware
 *
 * Sets CSP headers to control which resources can be loaded
 * and executed by the browser
 */
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval'; " +
      "connect-src 'self' https://*.supabase.co https://kffbwemulhhsyaiooabh.supabase.co wss://*.supabase.co wss://kffbwemulhhsyaiooabh.supabase.co https://api.jobtrakr.co.uk https://*.jobtrakr.co.uk https://*.linkedin.com https://*.indeed.com https://api.openai.com https://generativelanguage.googleapis.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "img-src 'self' https://*.supabase.co data: blob: https://*.jobtrakr.co.uk https://*.linkedin.com https://*.indeed.com; " +
      "frame-src 'self' https://*.supabase.co; " +
      "worker-src 'self' blob:;"
  );

  // Set Cross-Origin headers
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  // Set CORS headers to allow browser extension to access API
  const allowedOrigins = [
    "https://jobtrakr.co.uk",
    "https://www.jobtrakr.co.uk",
    "https://api.jobtrakr.co.uk",
    "https://kffbwemulhhsyaiooabh.supabase.co",
    "chrome-extension://bgboikgconkgnkdmcecehddgbjhopeod",
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  next();
});

//=============================================================================
// API ROUTES
//=============================================================================

// API endpoint for direct extension login
app.post("/api/auth/signin", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const supabase = getSupabaseClient();

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Add a delay to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return res.status(401).json({
        success: false,
        message: "Invalid email or password", // Generic message to prevent user enumeration
      });
    }

    // Set auth cookie for cross-origin access
    const token = data.session.access_token;
    res.cookie("jobtrakr-auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return success with user data
    return res.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      message: "Login successful",
      token: token, // Include token in response for the extension
    });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
});

// API endpoint for browser extension to check for existing session
app.get("/api/auth/session", async (req, res) => {
  try {
    // Get the session cookie
    const sessionCookie =
      req.cookies?.["jobtrakr-auth-token"] ||
      req.cookies?.["sb-kffbwemulhhsyaiooabh-auth-token"] ||
      req.headers.authorization?.split("Bearer ")[1];

    if (!sessionCookie) {
      return res
        .status(401)
        .json({ success: false, message: "No session found" });
    }

    const supabase = getSupabaseClient();

    // Get user from session
    const { data, error } = await supabase.auth.getUser(sessionCookie);

    if (error || !data.user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid session" });
    }

    // Return user info and token for the extension
    return res.json({
      success: true,
      token: sessionCookie,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      expiresIn: 86400, // 24 hours
    });
  } catch (error) {
    console.error("Session check error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// API endpoint for verifying tokens
app.get("/api/auth/verify", authLimiter, async (req, res) => {
  try {
    // Get the token from authorization header
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const supabase = getSupabaseClient();

    // Verify the token
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Return user info
    return res.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// API endpoint for Gemini AI calls - now with authentication and additional security
app.post("/api/ai/gemini", authenticateUser, aiApiLimiter, async (req, res) => {
  // Return coming soon message instead of actually processing
  return res.status(503).json({
    success: false,
    message: "AI features are coming soon",
    details:
      "We're working on bringing AI features to JobTrakr. Please check back later.",
  });
});

// Add fallback models endpoint - secured with authentication
app.post(
  "/api/ai/gemini/fallback",
  authenticateUser,
  aiApiLimiter,
  async (req, res) => {
    // Return coming soon message instead of actually processing
    return res.status(503).json({
      success: false,
      message: "AI features are coming soon",
      details:
        "We're working on bringing AI features to JobTrakr. Please check back later.",
    });
  }
);

//=============================================================================
// SERVER STARTUP
//=============================================================================

// Direct all other GET requests to index.html for SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export app for testing
module.exports = app;
