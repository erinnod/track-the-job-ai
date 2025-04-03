import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Applications from "./pages/Applications";
import Kanban from "./pages/Kanban";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Calendar from "./pages/Calendar";
import AuthCallback from "./pages/auth/Callback";
import SecurityAdmin from "./pages/admin/SecurityAdmin";
import { AuthProvider } from "./contexts/AuthContext";
import { AvatarProvider } from "./contexts/AvatarContext";
import { JobProvider } from "./contexts/JobContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SecurityMonitor } from "./components/security/SecurityMonitor";

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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AvatarProvider>
          <JobProvider>
            <BrowserRouter>
              <ScrollToTop />
              <SecurityMonitor />
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/applications" element={<Applications />} />
                  <Route path="/kanban" element={<Kanban />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/admin/security" element={<SecurityAdmin />} />
                </Route>

                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </JobProvider>
        </AvatarProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
