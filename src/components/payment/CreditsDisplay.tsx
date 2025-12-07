import { useState } from "react";
import { useCredits } from "@/contexts/CreditsContext";
import CreditPurchaseDialog from "./CreditPurchaseDialog";

interface CreditsDisplayProps {
  variant?: "card" | "inline" | "badge";
  showPurchaseButton?: boolean;
}

export default function CreditsDisplay({
  variant = "card",
  showPurchaseButton = true,
}: CreditsDisplayProps) {
  const { credits, isLoading, refreshCredits } = useCredits();
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  const handlePurchaseSuccess = () => {
    setShowPurchaseDialog(false);
    refreshCredits();
  };

  // The component no longer renders any visible UI elements
  // but still maintains the logic and structure to support future re-enabling

  // Keep the credit purchase dialog hidden but available
  return (
    <>
      {showPurchaseButton && (
        <CreditPurchaseDialog
          open={showPurchaseDialog}
          onOpenChange={setShowPurchaseDialog}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </>
  );
}
