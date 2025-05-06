const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, "dist")));

// Set Content Security Policy headers
app.use((req, res, next) => {
  // Determine if we're in development mode
  const isDev =
    process.env.NODE_ENV === "development" ||
    req.hostname === "localhost" ||
    req.hostname.includes("127.0.0.1");

  // Create CSP with appropriate settings based on environment
  let cspDirectives =
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://*.jobtrakr.co.uk/ https://jobtrakr.co.uk/ http://localhost:* https://localhost:*; " +
    "style-src 'self' 'unsafe-inline'; " +
    "style-src-elem 'self' 'unsafe-inline'; " +
    "connect-src 'self' https://*.supabase.co https://kffbwemulhhsyaiooabh.supabase.co wss://*.supabase.co wss://kffbwemulhhsyaiooabh.supabase.co https://api.jobtrakr.co.uk https://*.jobtrakr.co.uk https://*.linkedin.com https://*.indeed.com https://api.openai.com";

  // For development, allow localhost connections
  if (isDev) {
    cspDirectives +=
      " http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*";
  }

  // Add remaining directives
  cspDirectives +=
    "; " +
    "img-src 'self' https://*.supabase.co https://kffbwemulhhsyaiooabh.supabase.co/storage/* data: blob: https://*.jobtrakr.co.uk https://*.linkedin.com https://*.indeed.com; " +
    "font-src 'self' data:; " +
    "frame-src 'self' https://*.supabase.co; " +
    "worker-src 'self' blob:;";

  res.setHeader("Content-Security-Policy", cspDirectives);

  // Set Cross-Origin headers
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  next();
});

// For any other requests, send the index.html file
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
