export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type TransactionType = "purchase" | "usage";
export type FeatureType =
  | "cover_letter"
  | "resume"
  | "job_recommendation"
  | null;

export interface PaymentTransaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  transactionReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCredits {
  id: string;
  userId: string;
  creditBalance: number;
  lastUpdated: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  transactionType: TransactionType;
  featureUsed?: FeatureType;
  paymentTransactionId?: string;
  createdAt: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  isPopular?: boolean;
  description?: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "basic",
    name: "Basic",
    credits: 5,
    price: 10,
    currency: "GBP",
    description: "Perfect for occasional job applications",
  },
  {
    id: "standard",
    name: "Standard",
    credits: 15,
    price: 25,
    currency: "GBP",
    isPopular: true,
    description: "Best value for active job seekers",
  },
  {
    id: "premium",
    name: "Premium",
    credits: 30,
    price: 45,
    currency: "GBP",
    description: "Complete package for intensive job hunting",
  },
];
