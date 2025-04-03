import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getCurrentUser, signOut } from "@/lib/auth";
import { User } from "@supabase/supabase-js";

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTimeoutId, setSessionTimeoutId] = useState<number | null>(null);

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const { success, user } = await getCurrentUser();
      setUser(success ? user : null);
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      if (sessionTimeoutId) {
        window.clearTimeout(sessionTimeoutId);
        setSessionTimeoutId(null);
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Reset session timeout when user is active
  const resetSessionTimeout = () => {
    // Clear existing timeout
    if (sessionTimeoutId) {
      window.clearTimeout(sessionTimeoutId);
    }

    // Only set new timeout if user is logged in
    if (user) {
      const timeoutId = window.setTimeout(() => {
        console.log("Session expired due to inactivity");
        logout();
      }, SESSION_TIMEOUT);

      setSessionTimeoutId(timeoutId);
    }
  };

  // Set up activity listeners to reset session timeout
  useEffect(() => {
    if (!user) return;

    // Reset session timeout on initial login and user activity
    resetSessionTimeout();

    // Monitor user activity
    const activityEvents = [
      "mousedown",
      "keydown",
      "touchstart",
      "click",
      "scroll",
    ];

    const handleActivity = () => {
      resetSessionTimeout();
    };

    // Add event listeners for user activity
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Clean up event listeners when component unmounts
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (sessionTimeoutId) {
        window.clearTimeout(sessionTimeoutId);
      }
    };
  }, [user, sessionTimeoutId]);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
