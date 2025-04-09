const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse cookies
app.use(cookieParser());

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, "dist")));

// Set Content Security Policy headers
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "connect-src 'self' https://*.supabase.co https://kffbwemulhhsyaiooabh.supabase.co wss://*.supabase.co wss://kffbwemulhhsyaiooabh.supabase.co https://api.jobtrakr.co.uk https://*.jobtrakr.co.uk https://*.linkedin.com https://*.indeed.com https://api.openai.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' https://*.supabase.co data: blob: https://*.jobtrakr.co.uk https://*.linkedin.com https://*.indeed.com; " +
      "font-src 'self' data:; " +
      "frame-src 'self' https://*.supabase.co; " +
      "worker-src 'self' blob:;"
  );

  // Set Cross-Origin headers
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  // Set CORS headers to allow browser extension to access API
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// API endpoint for direct extension login
app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Import Supabase client
    const { createClient } = require("@supabase/supabase-js");
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL ||
      "https://kffbwemulhhsyaiooabh.supabase.co";
    const supabaseAnonKey =
      process.env.VITE_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmJ3ZW11bGhoc3lhaW9vYWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MDMzNTUsImV4cCI6MjA1OTE3OTM1NX0.CXa9wXaqwD7FVSnfUs120xD3NWg-GsNnBhwfbt4OSNg";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message,
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
      user: data.user,
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

    // Import Supabase client here to avoid top-level await
    const { createClient } = require("@supabase/supabase-js");
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL ||
      "https://kffbwemulhhsyaiooabh.supabase.co";
    const supabaseAnonKey =
      process.env.VITE_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmJ3ZW11bGhoc3lhaW9vYWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MDMzNTUsImV4cCI6MjA1OTE3OTM1NX0.CXa9wXaqwD7FVSnfUs120xD3NWg-GsNnBhwfbt4OSNg";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
app.get("/api/auth/verify", async (req, res) => {
  try {
    // Get the token from authorization header
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Import Supabase client
    const { createClient } = require("@supabase/supabase-js");
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL ||
      "https://kffbwemulhhsyaiooabh.supabase.co";
    const supabaseAnonKey =
      process.env.VITE_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmJ3ZW11bGhoc3lhaW9vYWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MDMzNTUsImV4cCI6MjA1OTE3OTM1NX0.CXa9wXaqwD7FVSnfUs120xD3NWg-GsNnBhwfbt4OSNg";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// Endpoint for website to redirect to extension with token
app.get("/api/auth/extension-redirect", async (req, res) => {
  try {
    // Get the session cookie
    const sessionCookie =
      req.cookies?.["jobtrakr-auth-token"] ||
      req.headers.authorization?.split("Bearer ")[1];

    if (!sessionCookie) {
      return res
        .status(401)
        .send("No session found. Please log in to the JobTrakr website first.");
    }

    // Import Supabase client
    const { createClient } = require("@supabase/supabase-js");
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL ||
      "https://kffbwemulhhsyaiooabh.supabase.co";
    const supabaseAnonKey =
      process.env.VITE_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmJ3ZW11bGhoc3lhaW9vYWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MDMzNTUsImV4cCI6MjA1OTE3OTM1NX0.CXa9wXaqwD7FVSnfUs120xD3NWg-GsNnBhwfbt4OSNg";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verify user from session
    const { data, error } = await supabase.auth.getUser(sessionCookie);

    if (error || !data.user) {
      return res
        .status(401)
        .send("Invalid session. Please log in to the JobTrakr website first.");
    }

    // Create a redirect URL with the token for the extension
    // The extension should be registered to handle this protocol
    const extensionUrl = `jobtrakr-extension://auth?token=${encodeURIComponent(
      sessionCookie
    )}&userId=${data.user.id}&email=${encodeURIComponent(
      data.user.email
    )}&source=website`;

    // Create an HTML page that explains and provides a button to connect
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connect to JobTrakr Extension</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
              text-align: center;
              padding: 40px 20px;
              max-width: 600px;
              margin: 0 auto;
              color: #333;
              line-height: 1.6;
            }
            h1 {
              color: #4a86e8;
              margin-bottom: 20px;
            }
            .info-box {
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              background-color: #4a86e8;
              color: white;
              padding: 12px 24px;
              border-radius: 4px;
              text-decoration: none;
              font-weight: 500;
              margin-top: 20px;
            }
            .manual-steps {
              text-align: left;
              margin-top: 30px;
              border-top: 1px solid #e0e0e0;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>Connect to JobTrakr Extension</h1>
          <p>You're logged in to the JobTrakr website as <strong>${data.user.email}</strong>.</p>
          
          <div class="info-box">
            <p>Click the button below to connect your browser extension with your website account.</p>
            <p>This will allow you to access your jobs from both the website and the extension.</p>
            <a href="${extensionUrl}" class="button">Connect Extension</a>
          </div>
          
          <div class="manual-steps">
            <h3>If the button doesn't work:</h3>
            <ol>
              <li>Make sure you have the JobTrakr extension installed</li>
              <li>Open the extension by clicking its icon in your browser toolbar</li>
              <li>The extension should automatically detect your website login</li>
            </ol>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Extension redirect error:", error);
    res.status(500).send("Server error. Please try again later.");
  }
});

// For any other requests, send the index.html file
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
