import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { purchaseCredits } from "@/lib/payments-service";
import { CREDIT_PACKAGES } from "@/types/payment";

interface CreditPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreditPurchaseDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreditPurchaseDialogProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // The purchase logic is maintained but not exposed in the UI
  const handlePurchase = async () => {
    if (!user?.id || !selectedPackage) {
      console.log("Purchase attempted but no package selected or no user");
      return;
    }

    setIsProcessing(true);

    try {
      // Process the payment
      await purchaseCredits(user.id, selectedPackage);

      if (onSuccess) {
        onSuccess();
      }

      // Close the dialog
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error purchasing credits:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Return null to hide the component completely
  return null;
}
