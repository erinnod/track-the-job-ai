/**
 * JobTrakr Production Server (CommonJS Version)
 *
 * This server provides the backend for the production environment,
 * serving static files and implementing comprehensive security measures.
 *
 * It uses Express for routing and middleware management.
 */

//=============================================================================
// DEPENDENCIES AND CONFIGURATION
//=============================================================================

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const app = express();
const PORT = process.env.PORT || 3000;

//=============================================================================
// MIDDLEWARE CONFIGURATION
//=============================================================================

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse cookies
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

  next();
});

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

//=============================================================================
// CONTENT SECURITY POLICY
//=============================================================================

/**
 * Content Security Policy middleware
 *
 * Sets CSP headers to control which resources can be loaded
 * and executed by the browser
 */
app.use((req, res, next) => {
  // Determine if we're in development mode
  const isDev =
    process.env.NODE_ENV === "development" ||
    req.hostname === "localhost" ||
    req.hostname.includes("127.0.0.1");

  // Create CSP with appropriate settings based on environment
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://*.jobtrakr.co.uk/ https://jobtrakr.co.uk/",
    "style-src 'self' 'unsafe-inline'",
    "style-src-elem 'self' 'unsafe-inline'",
    "connect-src 'self' https://*.supabase.co https://kffbwemulhhsyaiooabh.supabase.co wss://*.supabase.co wss://kffbwemulhhsyaiooabh.supabase.co https://api.jobtrakr.co.uk https://*.jobtrakr.co.uk https://*.linkedin.com https://*.indeed.com https://api.openai.com https://generativelanguage.googleapis.com",
    "img-src 'self' https://*.supabase.co https://kffbwemulhhsyaiooabh.supabase.co/storage/* data: blob: https://*.jobtrakr.co.uk https://*.linkedin.com https://*.indeed.com",
    "font-src 'self' data:",
    "frame-src 'self' https://*.supabase.co",
    "worker-src 'self' blob:",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  // For development, allow localhost connections
  if (isDev) {
    cspDirectives.push(
      "connect-src 'self' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*"
    );
  }

  res.setHeader("Content-Security-Policy", cspDirectives.join("; "));

  // Set Cross-Origin headers
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  // Set CORS headers for allowed origins
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
// ROUTES
//=============================================================================

/**
 * Catch-all route handler
 *
 * For any request not handled by static files, send the index.html file
 * This enables client-side routing to work properly
 */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Create a nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.VITE_EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.VITE_EMAIL_PORT || "587", 10),
    secure: process.env.VITE_EMAIL_SECURE === "true",
    auth: {
      user: process.env.VITE_EMAIL_USER,
      pass: process.env.VITE_EMAIL_PASSWORD,
    },
  });
};

// Email API endpoints
app.post("/api/email/send", async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `JobTrakr <${process.env.VITE_EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.post("/api/email/send-verification", async (req, res) => {
  try {
    const { email, verificationLink } = req.body;

    if (!email || !verificationLink) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `JobTrakr <${process.env.VITE_EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - JobTrakr",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email Address</h2>
          <p>Please click the link below to verify your email address for JobTrakr:</p>
          <p>
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
              Verify Email
            </a>
          </p>
          <p>If you did not request this verification, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
          <p>Thank you,<br>The JobTrakr Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending verification email:", error);
    res.status(500).json({ error: "Failed to send verification email" });
  }
});

//=============================================================================
// SERVER STARTUP
//=============================================================================

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export app for testing
module.exports = app;
