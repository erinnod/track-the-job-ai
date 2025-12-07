import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: {
      origin: ["http://localhost:8080", "http://localhost:3000"],
    },
    fs: {
      // Allow serving files from one level up to the project root
      strict: false,
    },
    hmr: {
      // Make HMR more robust
      overlay: true,
      clientPort: 8080,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["framer-motion"],
    force: true,
  },
  build: {
    // Generate sourcemaps - use 'true' instead of conditional for consistent formatting
    sourcemap: true,
    // Ensure proper module handling
    modulePreload: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: ['nodemailer', 'node-cron'],
    },
  },
  define: {
    global: 'globalThis',
  },
  define: {
    // Include these at build time
    "process.env.VITE_EMAIL_HOST": JSON.stringify(process.env.VITE_EMAIL_HOST),
    "process.env.VITE_EMAIL_PORT": JSON.stringify(process.env.VITE_EMAIL_PORT),
    "process.env.VITE_EMAIL_SECURE": JSON.stringify(
      process.env.VITE_EMAIL_SECURE
    ),
    "process.env.VITE_EMAIL_USER": JSON.stringify(process.env.VITE_EMAIL_USER),
    "process.env.VITE_EMAIL_PASSWORD": JSON.stringify(
      process.env.VITE_EMAIL_PASSWORD
    ),
    "process.env.VITE_GMAIL_CLIENT_ID": JSON.stringify(
      process.env.VITE_GMAIL_CLIENT_ID
    ),
    "process.env.VITE_OUTLOOK_CLIENT_ID": JSON.stringify(
      process.env.VITE_OUTLOOK_CLIENT_ID
    ),
  },
}));
