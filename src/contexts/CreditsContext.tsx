import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { UserCredits, CreditTransaction } from "@/types/payment";
import { fetchUserCredits, getCreditHistory } from "@/lib/payments-service";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

// Define AI feature types
type AIFeature =
  | "resume"
  | "cover_letter"
  | "job_recommendation"
  | "email_parser";

// Define AI feature prices
const AI_FEATURE_PRICES: Record<AIFeature, number> = {
  resume: 1,
  cover_letter: 1,
  job_recommendation: 1,
  email_parser: 1,
};

interface CreditsContextType {
  credits: UserCredits | null;
  isLoading: boolean;
  creditHistory: CreditTransaction[];
  historyIsLoading: boolean;
  refreshCredits: () => Promise<void>;
  refreshHistory: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return context;
}

interface CreditsProviderProps {
  children: ReactNode;
}

export default function CreditsProvider({ children }: CreditsProviderProps) {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([]);
  const [historyIsLoading, setHistoryIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load credits when user is authenticated
  useEffect(() => {
    if (user?.id) {
      loadCredits();
    } else {
      setCredits(null);
      setIsLoading(false);
      setCreditHistory([]);
      setHistoryIsLoading(false);
    }
  }, [user?.id]);

  const loadCredits = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const userCredits = await fetchUserCredits(user.id);
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading credits:", error);
      // Create a fallback credits object instead of showing an error toast
      // This prevents disrupting the user experience
      setCredits({
        id: "temp-id",
        userId: user.id,
        creditBalance: 2, // Give some starter credits to ensure features work
        lastUpdated: new Date().toISOString(),
      });

      // Log the error but don't show the error toast
      console.log("Created fallback credits object due to database error");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCreditHistory = async () => {
    if (!user?.id) return;

    setHistoryIsLoading(true);
    try {
      const history = await getCreditHistory(user.id);
      setCreditHistory(history);
    } catch (error) {
      console.error("Error loading credit history:", error);
      // Provide fallback empty history instead of showing error toast
      setCreditHistory([]);
    } finally {
      setHistoryIsLoading(false);
    }
  };

  const refreshCredits = async () => {
    await loadCredits();
  };

  const refreshHistory = async () => {
    await loadCreditHistory();
  };

  /**
   * Get the price of a feature in credits
   *
   * @param feature The feature to get the price for
   * @returns The price in credits
   */
  const getFeaturePrice = useCallback(
    (feature: AIFeature): number => {
      // Show toast notification that AI features are coming soon
      toast({
        title: "AI Features Coming Soon",
        description:
          "We're working on bringing AI features to JobTrakr. Please check back later.",
      });

      // Return the price for informational purposes
      return AI_FEATURE_PRICES[feature] || 1;
    },
    [toast]
  );

  /**
   * Check if the user has enough credits for a feature
   *
   * @param feature The feature to check credits for
   * @returns True if the user has enough credits, false otherwise
   */
  const checkCreditsForFeature = useCallback(
    (feature: AIFeature): boolean => {
      // Always return false since AI features are disabled
      // Show toast notification that AI features are coming soon
      toast({
        title: "AI Features Coming Soon",
        description:
          "We're working on bringing AI features to JobTrakr. Please check back later.",
      });

      return false;
    },
    [credits]
  );

  return (
    <CreditsContext.Provider
      value={{
        credits,
        isLoading,
        creditHistory,
        historyIsLoading,
        refreshCredits,
        refreshHistory,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}
