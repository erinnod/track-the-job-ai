/**
 * Application Entry Point
 *
 * This file is the entry point for the React application. It renders the root
 * App component into the DOM element with the ID "root".
 *
 * The main.tsx file is kept minimal to ensure fast initial loading, with most
 * of the configuration and provider setup happening in the App component.
 *
 * Key responsibilities:
 * - Import the Root App component and CSS
 * - Create the React root using ReactDOM
 * - Render the App with StrictMode (in development) for additional checks
 * - Initialize the application rendering process
 */

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Create and render the root React component into the DOM
createRoot(document.getElementById("root")!).render(<App />);
