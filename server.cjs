const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

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
