import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  UNSAFE_DataRouterContext,
  UNSAFE_DataRouterStateContext,
} from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import Index from "./pages/Index";
import Applications from "./pages/Applications";
import Kanban from "./pages/Kanban";
import Documents from "./pages/Documents";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Calendar from "./pages/Calendar";
import AuthCallback from "./pages/auth/Callback";
import SecurityAdmin from "./pages/admin/SecurityAdmin";
import Notifications from "./pages/Notifications";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import Contact from "./pages/legal/Contact";
import { AuthProvider } from "./contexts/AuthContext";
import { AvatarProvider } from "./contexts/AvatarContext";
import { JobProvider } from "./contexts/JobContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SecurityMonitor } from "./components/security/SecurityMonitor";
import FaviconNotifier from "./components/notifications/FaviconNotifier";
import LoadingFallback from "./components/ui/loading-fallback";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Set React Router future flags to fix warning messages
// See: https://reactrouter.com/v6/upgrading/future
UNSAFE_DataRouterContext.displayName = "DataRouterContext";
UNSAFE_DataRouterStateContext.displayName = "DataRouterStateContext";

// Configure React Router future flags
const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

// Lazy load settings pages
const SettingsIndex = lazy(() => import("./pages/settings/index"));
const IntegrationsPage = lazy(() => import("./pages/settings/integrations"));
const ProfilePage = lazy(() => import("./pages/settings/profile"));

// Lazy load help pages
const BrowserExtensionHelp = lazy(
  () => import("./pages/help/BrowserExtension")
);

// This component will scroll the page to the top when navigating between routes
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

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={routerFutureConfig}>
        <AuthProvider>
          <AvatarProvider>
            <JobProvider>
              <NotificationProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <ScrollToTop />
                  <SecurityMonitor />
                  <FaviconNotifier />
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    {/* Legal pages (public) */}
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/contact" element={<Contact />} />

                    {/* Help pages (moved outside of ProtectedRoute) */}
                    <Route
                      path="/help/browser-extension"
                      element={
                        <Suspense fallback={<LoadingFallback />}>
                          <BrowserExtensionHelp />
                        </Suspense>
                      }
                    />

                    {/* Protected routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/" element={<Index />} />
                      <Route path="/applications" element={<Applications />} />
                      <Route path="/kanban" element={<Kanban />} />
                      <Route path="/documents" element={<Documents />} />
                      <Route path="/calendar" element={<Calendar />} />

                      {/* Settings routes */}
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
                          <Suspense fallback={<LoadingFallback />}>
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
                        path="/notifications"
                        element={<Notifications />}
                      />
                      <Route
                        path="/admin/security"
                        element={<SecurityAdmin />}
                      />
                    </Route>

                    {/* Catch-all route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </TooltipProvider>
              </NotificationProvider>
            </JobProvider>
          </AvatarProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
