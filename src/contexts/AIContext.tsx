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

  // AI is explicitly disabled
  const isAIEnabled = false;

  // Helper to set which model was used for generation
  const setCurrentModel = useCallback((model: string | null) => {
    setModelUsed(model);
  }, []);

  // Standardized error handling for AI operations
  const handleAIError = useCallback(
    (error: any) => {
      // Show coming soon message instead of actual error
      toast.info("AI Features Coming Soon", {
        description:
          "We're working on bringing AI features to JobTrakr. Please check back later.",
      });

      // Log the original error for debugging
      console.log(
        "AI operation attempted (currently disabled):",
        error?.message || "Unknown request"
      );
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
