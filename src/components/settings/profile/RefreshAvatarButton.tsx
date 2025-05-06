import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { forceReloadAllAvatars } from "@/lib/avatar-utils";
import { useToast } from "@/hooks/use-toast";

interface RefreshAvatarButtonProps {
  className?: string;
}

/**
 * A utility button that manually forces all avatars to refresh
 */
const RefreshAvatarButton: React.FC<RefreshAvatarButtonProps> = ({
  className = "",
}) => {
  const { toast } = useToast();

  const handleRefresh = () => {
    // Force refresh all avatars
    forceReloadAllAvatars();

    // Show a success message
    toast({
      title: "Avatar refreshed",
      description: "Your profile picture has been refreshed across the app.",
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      className={className}
    >
      <RefreshCcw className="mr-2 h-4 w-4" />
      Refresh Avatar
    </Button>
  );
};

export default RefreshAvatarButton;
