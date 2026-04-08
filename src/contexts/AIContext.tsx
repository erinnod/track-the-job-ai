import React, { createContext, useContext, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface AIContextType {
  isLoading: boolean;
  modelUsed: string | null;
  handleAIError: (error: any) => void;
  setCurrentModel: (model: string | null) => void;
  isAIEnabled: boolean;
}

const AIContext = createContext<AIContextType>({
  isLoading: false,
  modelUsed: null,
  handleAIError: () => {},
  setCurrentModel: () => {},
  isAIEnabled: false,
});

export const useAI = () => useContext(AIContext);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const { user } = useAuth();

  // AI is enabled
  const isAIEnabled = true;

  // Helper to set which model was used for generation
  const setCurrentModel = useCallback((model: string | null) => {
    setModelUsed(model);
  }, []);

  // Standardized error handling for AI operations
  const handleAIError = useCallback(
    (error: any) => {
      const message = error?.message || "An unexpected error occurred";

      if (
        message.includes("quota") ||
        message.includes("rate limit") ||
        message.includes("RESOURCE_EXHAUSTED")
      ) {
        toast.error("AI Rate Limit Reached", {
          description:
            "Too many requests. Please wait a moment before trying again.",
        });
      } else if (
        message.includes("timed out") ||
        message.includes("NetworkError")
      ) {
        toast.error("Connection Error", {
          description:
            "Could not reach the AI service. Check your connection and try again.",
        });
      } else if (message.includes("Server proxy error: 401")) {
        toast.error("Authentication Error", {
          description: "Please log out and back in, then try again.",
        });
      } else {
        toast.error("AI Error", {
          description: message,
        });
      }
    },
    [user]
  );

  const value = {
    isLoading,
    modelUsed,
    handleAIError,
    setCurrentModel,
    isAIEnabled,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};
