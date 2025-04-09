import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const [authAttempted, setAuthAttempted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const location = useLocation();

  // Create a loading timeout to prevent eternal loading
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create a ref to detect if component is still mounted
  const isMountedRef = useRef(true);

  // Attempt to refresh user authentication on mount
  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;

    // Set a timeout to clear the loading state if it gets stuck
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setAuthAttempted(true);
      }
    }, 5000); // 5 second max loading time

    const attemptAuth = async () => {
      try {
        await refreshUser();
        if (isMountedRef.current) {
          setAuthAttempted(true);
        }
      } catch (error) {
        console.error("Authentication error in ProtectedRoute:", error);
        if (isMountedRef.current) {
          setHasError(true);
          setAuthAttempted(true);
        }
      }
    };

    attemptAuth();

    // Clean up function to clear timeout and prevent memory leaks
    return () => {
      isMountedRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [refreshUser]);

  // If we've already authenticated, don't show the loader
  if (isAuthenticated) {
    return <Outlet />;
  }

  // If still loading and haven't attempted auth yet, show loader
  if (isLoading && !authAttempted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }

  // If there was an error or not authenticated after attempting, redirect to login
  if (hasError || (!isLoading && !isAuthenticated && authAttempted)) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Fallback loading state (should rarely hit this)
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-lg">Verifying access...</span>
    </div>
  );
};
