/**
 * Main Application Component
 *
 * This component sets up the application's routing structure and provider hierarchy.
 * It includes:
 * - UI component providers (Toaster, TooltipProvider)
 * - Data providers (Auth, Jobs, Notifications, etc.)
 * - React Router configuration
 * - Error boundaries
 * - Route definitions (public, protected, and admin routes)
 *
 * The providers are nested to ensure proper data flow and dependencies between contexts.
 * The routing structure follows a role-based access control pattern with protected routes
 * requiring authentication before access is granted.
 */

//=============================================================================
// IMPORTS
//=============================================================================

// UI Components
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastStateProvider } from "@/hooks/use-toast";
import { MobileToastProvider } from "@/components/ui/mobile-toast";
import LoadingFallback from "./components/ui/loading-fallback";

// Router and Navigation
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  UNSAFE_DataRouterContext,
  UNSAFE_DataRouterStateContext,
} from "react-router-dom";

// Data Management
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Context Providers
import AuthProvider from "./contexts/AuthContext";
import AvatarProvider from "./contexts/AvatarContext";
import JobProvider from "./contexts/JobContext";
import NotificationProvider from "./contexts/NotificationContext";
import CreditsProvider from "./contexts/CreditsContext";
import { AIProvider } from "./contexts/AIContext";

// Components
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SecurityMonitor } from "./components/security/SecurityMonitor";
import FaviconNotifier from "./components/notifications/FaviconNotifier";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Hooks
import { useEffect, lazy, Suspense } from "react";

//=============================================================================
// PAGE COMPONENTS
//=============================================================================

// Page Components - Main
import Index from "./pages/Index";
import Applications from "./pages/Applications";
import Kanban from "./pages/Kanban";
import Documents from "./pages/Documents";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/Landing";
import Notifications from "./pages/Notifications";

// Page Components - Auth
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/auth/Callback";
import EmailCallback from "./pages/auth/EmailCallback";
import EmailVerification from "./components/EmailVerification";

// Page Components - Legal
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import Contact from "./pages/legal/Contact";

// Page Components - Admin
import SecurityAdmin from "./pages/admin/SecurityAdmin";

//=============================================================================
// CONFIGURATION
//=============================================================================

// Fix React Router warnings by setting display names
UNSAFE_DataRouterContext.displayName = "DataRouterContext";
UNSAFE_DataRouterStateContext.displayName = "DataRouterStateContext";

// Configure React Router future flags for newer features
const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

// Lazy-loaded components to improve initial load performance
const SettingsIndex = lazy(() => import("./pages/settings/index"));
const IntegrationsPage = lazy(() => import("./pages/settings/integrations"));
const ProfilePage = lazy(() => import("./pages/settings/profile"));
const SecurityPage = lazy(() => import("./pages/settings/security"));
const NotificationsPage = lazy(() => import("./pages/settings/notifications"));
const BrowserExtensionHelp = lazy(
  () => import("./pages/help/BrowserExtension")
);

/**
 * ScrollToTop Component
 *
 * This component scrolls the page to the top when navigating between routes.
 * It uses the pathname from useLocation to detect route changes.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset scroll position when route changes
    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Initialize query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1, // Only retry failed queries once
    },
  },
});

//=============================================================================
// APPLICATION COMPONENTS
//=============================================================================

/**
 * AppContent Component
 *
 * Contains the core application structure including providers, routes, and UI components.
 * This is separated from the App component to facilitate testing and composition.
 */
const AppContent = () => (
  <>
    <ToastStateProvider>
      <MobileToastProvider>
        <AuthProvider>
          <AvatarProvider>
            <JobProvider>
              <NotificationProvider>
                <CreditsProvider>
                  <AIProvider>
                    <TooltipProvider>
                      {/* Notification components */}
                      <Toaster />
                      <Sonner />
                      <ScrollToTop />
                      <SecurityMonitor />
                      <FaviconNotifier />

                      <Routes>
                        {" "}
                        {/* Public routes - accessible to all users */}{" "}
                        <Route path="/" element={<LandingPage />} />{" "}
                        <Route path="/login" element={<Login />} />{" "}
                        <Route path="/signup" element={<SignUp />} />{" "}
                        <Route
                          path="/forgot-password"
                          element={<ForgotPassword />}
                        />{" "}
                        <Route
                          path="/reset-password"
                          element={<ResetPassword />}
                        />{" "}
                        <Route
                          path="/verify-email"
                          element={<EmailVerification />}
                        />{" "}
                        <Route
                          path="/auth/callback"
                          element={<AuthCallback />}
                        />{" "}
                        <Route
                          path="/auth/gmail/callback"
                          element={<EmailCallback />}
                        />{" "}
                        <Route
                          path="/auth/outlook/callback"
                          element={<EmailCallback />}
                        />
                        {/* Legal pages - public access */}
                        <Route
                          path="/privacy-policy"
                          element={<PrivacyPolicy />}
                        />
                        <Route path="/terms" element={<TermsOfService />} />
                        <Route path="/contact" element={<Contact />} />
                        {/* Help pages - public access */}
                        <Route
                          path="/help/browser-extension"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <BrowserExtensionHelp />
                            </Suspense>
                          }
                        />
                        {/* Protected routes - require authentication */}
                        <Route element={<ProtectedRoute />}>
                          {/* Dashboard and main application routes */}
                          <Route path="/dashboard" element={<Index />} />
                          <Route
                            path="/applications"
                            element={<Applications />}
                          />
                          <Route path="/kanban" element={<Kanban />} />
                          <Route path="/documents" element={<Documents />} />
                          <Route path="/calendar" element={<Calendar />} />
                          <Route
                            path="/notifications"
                            element={<Notifications />}
                          />

                          {/* Settings routes - lazy loaded */}
                          <Route
                            path="/settings"
                            element={
                              <Suspense fallback={<LoadingFallback />}>
                                <SettingsIndex />
                              </Suspense>
                            }
                          />
                          <Route
                            path="/settings/integrations"
                            element={
                              <Suspense
                                fallback={<LoadingFallback />}
                                key="integrations-page"
                              >
                                <IntegrationsPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="/settings/profile"
                            element={
                              <Suspense fallback={<LoadingFallback />}>
                                <ProfilePage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="/settings/security"
                            element={
                              <Suspense fallback={<LoadingFallback />}>
                                <SecurityPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="/settings/notifications"
                            element={
                              <Suspense fallback={<LoadingFallback />}>
                                <NotificationsPage />
                              </Suspense>
                            }
                          />

                          {/* Admin routes - protected with role check */}
                          <Route
                            path="/admin/security"
                            element={<SecurityAdmin />}
                          />
                        </Route>
                        {/* Fallback route for any undefined paths */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </TooltipProvider>
                  </AIProvider>
                </CreditsProvider>
              </NotificationProvider>
            </JobProvider>
          </AvatarProvider>
        </AuthProvider>
      </MobileToastProvider>
    </ToastStateProvider>
  </>
);

/**
 * Main App Component
 *
 * Wraps the application with necessary providers:
 * - React Query for data fetching and caching
 * - ErrorBoundary for global error handling
 * - BrowserRouter for routing
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <BrowserRouter future={routerFutureConfig}>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
