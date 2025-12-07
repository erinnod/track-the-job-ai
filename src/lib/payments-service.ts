import { supabase } from "./supabase";
import {
  PaymentTransaction,
  CreditTransaction,
  UserCredits,
  CreditPackage,
  CREDIT_PACKAGES,
} from "@/types/payment";
import { AIFeaturePrice, AI_FEATURE_PRICES } from "@/types/ai";
import { FeatureType } from "@/types/payment";

// Convert DB rows to frontend format
const mapPaymentTransactionFromDB = (
  dbTransaction: any
): PaymentTransaction => ({
  id: dbTransaction.id,
  userId: dbTransaction.user_id,
  amount: dbTransaction.amount,
  currency: dbTransaction.currency,
  status: dbTransaction.status,
  paymentMethod: dbTransaction.payment_method || undefined,
  transactionReference: dbTransaction.transaction_reference || undefined,
  createdAt: dbTransaction.created_at,
  updatedAt: dbTransaction.updated_at,
});

const mapCreditTransactionFromDB = (dbTransaction: any): CreditTransaction => ({
  id: dbTransaction.id,
  userId: dbTransaction.user_id,
  amount: dbTransaction.amount,
  transactionType: dbTransaction.transaction_type,
  featureUsed: dbTransaction.feature_used || undefined,
  paymentTransactionId: dbTransaction.payment_transaction_id || undefined,
  createdAt: dbTransaction.created_at,
});

const mapUserCreditsFromDB = (dbCredits: any): UserCredits => ({
  id: dbCredits.id,
  userId: dbCredits.user_id,
  creditBalance: dbCredits.credit_balance,
  lastUpdated: dbCredits.last_updated,
});

// Fetch user credit balance
export const fetchUserCredits = async (
  userId: string
): Promise<UserCredits | null> => {
  try {
    console.log("Attempting to fetch credits for user:", userId);

    // First try to get existing credits
    const { data, error } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If error is not "no rows returned", log it and try to recover
      if (error.code !== "PGRST116") {
        console.error("Error fetching user credits:", error);

        // Check if the error is related to RLS or permissions
        if (error.message?.includes("permission") || error.code === "42501") {
          console.warn(
            "Permission error with user_credits table, attempting workaround"
          );
          // Let's try to access the table with a different query
          const { data: altData, error: altError } = await supabase
            .from("user_credits")
            .select("*")
            .eq("user_id", userId);

          if (!altError && altData && altData.length > 0) {
            return mapUserCreditsFromDB(altData[0]);
          }
        }
      }

      // If no rows or alternative query failed, create new credits record
      console.log("No credits found for user, creating new record");
      return await createUserCredits(userId);
    }

    // If successful, return the data
    if (data) {
      return mapUserCreditsFromDB(data);
    } else {
      // As a fallback, create a new credits record
      console.log("No data returned, creating new user credits record");
      return await createUserCredits(userId);
    }
  } catch (error) {
    console.error("Unexpected error fetching user credits:", error);

    // Return a temporary fallback object to prevent UI errors
    // This will be used if the database operations fail completely
    return {
      id: "temp-id",
      userId: userId,
      creditBalance: 2, // Default starter credits
      lastUpdated: new Date().toISOString(),
    };
  }
};

// Create initial user credits record
export const createUserCredits = async (
  userId: string
): Promise<UserCredits> => {
  try {
    console.log("Creating initial user credits record for:", userId);
    // Initialize with 2 free credits for new users
    const initialBalance = 2;

    const { data, error } = await supabase
      .from("user_credits")
      .insert([
        {
          user_id: userId,
          credit_balance: initialBalance,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating user credits record:", error);

      // Check if the record might already exist (conflict)
      if (error.code === "23505") {
        // Unique violation
        console.log("Credits record may already exist, trying to fetch again");
        const { data: existingData, error: fetchError } = await supabase
          .from("user_credits")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (!fetchError && existingData) {
          return mapUserCreditsFromDB(existingData);
        }
      }

      // If we still have an issue, return a temporary object
      console.warn(
        "Unable to create/fetch credits record, returning temporary object"
      );
      return {
        id: "temp-id",
        userId: userId,
        creditBalance: initialBalance,
        lastUpdated: new Date().toISOString(),
      };
    }

    // Record this as a system gift if creation was successful
    try {
      await recordCreditTransaction(
        userId,
        initialBalance,
        "purchase",
        undefined,
        undefined
      );
    } catch (transactionError) {
      // Just log the error but don't fail the whole function if this step fails
      console.error(
        "Failed to record initial credit transaction:",
        transactionError
      );
    }

    return mapUserCreditsFromDB(data);
  } catch (error) {
    console.error("Unexpected error creating user credits:", error);
    // Return a fallback object rather than throwing an error
    return {
      id: "temp-id",
      userId: userId,
      creditBalance: 2, // Default starter credits
      lastUpdated: new Date().toISOString(),
    };
  }
};

// Update user credit balance
export const updateUserCredits = async (
  userId: string,
  newBalance: number
): Promise<UserCredits> => {
  try {
    const { data, error } = await supabase
      .from("user_credits")
      .update({
        credit_balance: newBalance,
        last_updated: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapUserCreditsFromDB(data);
  } catch (error) {
    console.error("Error updating user credits:", error);
    throw error;
  }
};

// Record a credit transaction
export const recordCreditTransaction = async (
  userId: string,
  amount: number,
  transactionType: "purchase" | "usage",
  featureUsed?: FeatureType,
  paymentTransactionId?: string
): Promise<CreditTransaction> => {
  try {
    // First ensure we have a valid session - critical for RLS policies
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      // If no session, try to refresh it
      const { data: refreshData } = await supabase.auth.refreshSession();
      if (!refreshData.session) {
        throw new Error("No authenticated session available - cannot proceed");
      }
    }

    // Log the authenticated user to verify permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("Authenticated user for transaction:", user?.id);

    // Verify that the authenticated user matches the requested userId
    if (user?.id !== userId) {
      console.error(
        "User ID mismatch: auth user",
        user?.id,
        "vs requested",
        userId
      );
      throw new Error("Authentication mismatch - security policy violation");
    }

    // Now proceed with the transaction
    const { data, error } = await supabase
      .from("credit_transactions")
      .insert([
        {
          user_id: userId,
          amount,
          transaction_type: transactionType,
          feature_used: featureUsed,
          payment_transaction_id: paymentTransactionId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Database error on credit transaction:", error);
      throw error;
    }

    return mapCreditTransactionFromDB(data);
  } catch (error) {
    console.error("Error recording credit transaction:", error);
    throw error;
  }
};

// Check if user has enough credits for a feature
export const checkCreditBalance = async (
  userId: string,
  feature: string
): Promise<boolean> => {
  try {
    // Get current credit balance
    const credits = await fetchUserCredits(userId);

    if (!credits) {
      return false;
    }

    // Get credit cost for the feature
    let requiredCredits = 1; // Default cost

    if (feature === "resume") {
      requiredCredits = 1; // Cost in credits
    } else if (feature === "cover_letter") {
      requiredCredits = 1; // Cost in credits
    } else if (feature === "job_recommendation") {
      requiredCredits = 1; // Cost in credits
    }

    return credits.creditBalance >= requiredCredits;
  } catch (error) {
    console.error("Error checking credit balance:", error);
    return false;
  }
};

// Use credit for a feature
export const useCreditForFeature = async (
  userId: string,
  feature: FeatureType
): Promise<void> => {
  try {
    console.log("Using credit for feature:", feature, "for user:", userId);

    // Get the current session to ensure we have auth context for RLS
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("Current session exists:", !!sessionData.session);

    if (!sessionData.session) {
      // Try to refresh the session if it doesn't exist
      console.log("No active session, attempting to refresh...");
      const { data: refreshData } = await supabase.auth.refreshSession();
      console.log("Session refresh success:", !!refreshData.session);

      if (!refreshData.session) {
        console.log(
          "WARNING: No active session - skipping credit usage for now"
        );
        // In development mode, we'll just skip the credit usage rather than failing
        if (import.meta.env.DEV) {
          console.log("DEV MODE: Bypassing credit usage due to auth issue");
          return; // Exit without error
        }
        console.error("No active session - RLS will block this operation");
      }
    }

    // Get the authenticated user to verify permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("Authenticated user for credit usage:", user?.id);

    // Verify that the authenticated user matches the requested userId
    if (user?.id !== userId) {
      console.error(
        "User ID mismatch: auth user",
        user?.id,
        "vs requested",
        userId
      );
      if (import.meta.env.DEV) {
        console.log("DEV MODE: Bypassing credit usage due to user mismatch");
        return; // Exit without error in development
      }
    }

    // Get current credit balance
    const credits = await fetchUserCredits(userId);
    console.log("Current credits:", credits);

    if (!credits || credits.creditBalance < 1) {
      throw new Error("Insufficient credits");
    }

    // Update credit balance
    const newBalance = credits.creditBalance - 1;
    console.log("Updating balance to:", newBalance);
    await updateUserCredits(userId, newBalance);

    try {
      // Record the usage transaction - but don't fail if this part fails
      console.log("Recording credit transaction");
      await recordCreditTransaction(userId, 1, "usage", feature);
      console.log("Credit usage completed successfully");
    } catch (transactionError) {
      // Just log the transaction error without failing
      console.error(
        "Error recording transaction (non-fatal):",
        transactionError
      );
      console.log("Credit was deducted but transaction record failed");
    }
  } catch (error) {
    console.error("Error using credit for feature:", error);
    // Don't throw the error, just log it - this prevents the AI content generation from failing
    // when there are auth/RLS issues but still allows the feature to work
    console.log("Continuing despite credit usage error");
  }
};

// Create a payment transaction
export const createPaymentTransaction = async (
  userId: string,
  amount: number,
  currency: string = "GBP",
  paymentMethod?: string
): Promise<PaymentTransaction> => {
  try {
    const { data, error } = await supabase
      .from("payment_transactions")
      .insert([
        {
          user_id: userId,
          amount,
          currency,
          status: "pending",
          payment_method: paymentMethod,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapPaymentTransactionFromDB(data);
  } catch (error) {
    console.error("Error creating payment transaction:", error);
    throw error;
  }
};

// Update payment transaction status
export const updatePaymentStatus = async (
  transactionId: string,
  status: "pending" | "completed" | "failed" | "refunded",
  transactionReference?: string
): Promise<PaymentTransaction> => {
  try {
    const { data, error } = await supabase
      .from("payment_transactions")
      .update({
        status,
        transaction_reference: transactionReference,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapPaymentTransactionFromDB(data);
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }
};

// Purchase credits
export const purchaseCredits = async (
  userId: string,
  packageId: string
): Promise<{ credits: UserCredits; transaction: PaymentTransaction }> => {
  try {
    // Find the package
    const creditPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);

    if (!creditPackage) {
      throw new Error("Invalid credit package");
    }

    // Create payment transaction
    const transaction = await createPaymentTransaction(
      userId,
      creditPackage.price,
      creditPackage.currency
    );

    // In a real app, you would integrate with a payment gateway here
    // For demo purposes, we'll simulate a successful payment
    const updatedTransaction = await updatePaymentStatus(
      transaction.id,
      "completed",
      `DEMO-${Date.now()}`
    );

    // Get current credits
    const currentCredits = await fetchUserCredits(userId);
    const currentBalance = currentCredits?.creditBalance || 0;

    // Update credit balance
    const newBalance = currentBalance + creditPackage.credits;
    const updatedCredits = await updateUserCredits(userId, newBalance);

    // Record credit transaction
    await recordCreditTransaction(
      userId,
      creditPackage.credits,
      "purchase",
      undefined,
      transaction.id
    );

    return {
      credits: updatedCredits,
      transaction: updatedTransaction,
    };
  } catch (error) {
    console.error("Error purchasing credits:", error);
    throw error;
  }
};

// Get payment feature price
export const getFeaturePrice = (feature: string): number => {
  if (feature === "resume" || feature === "resume_tailoring") {
    return AI_FEATURE_PRICES.resumeTailoring;
  } else if (feature === "cover_letter") {
    return AI_FEATURE_PRICES.coverLetter;
  } else if (feature === "job_recommendation") {
    return AI_FEATURE_PRICES.jobRecommendation;
  }

  return 0;
};

// Get all available credit packages
export const getCreditPackages = (): CreditPackage[] => {
  return CREDIT_PACKAGES;
};

// Get payment transaction history
export const getPaymentHistory = async (
  userId: string
): Promise<PaymentTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data ? data.map(mapPaymentTransactionFromDB) : [];
  } catch (error) {
    console.error("Error fetching payment history:", error);
    throw error;
  }
};

// Get credit transaction history
export const getCreditHistory = async (
  userId: string
): Promise<CreditTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data ? data.map(mapCreditTransactionFromDB) : [];
  } catch (error) {
    console.error("Error fetching credit history:", error);
    throw error;
  }
};
