import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAvatarRefresh } from "@/hooks/useAvatarRefresh";
import { useAvatar } from "@/contexts/AvatarContext";

interface DirectAvatarImageProps {
  userId: string | undefined;
  filePath: string | undefined | null;
  fallback: string;
  className?: string;
  onClick?: () => void;
}

/**
 * A component that directly manages avatar display with forced refresh
 */
const DirectAvatarImage: React.FC<DirectAvatarImageProps> = ({
  userId,
  filePath,
  fallback,
  className = "",
  onClick,
}) => {
  const { avatarUrl, isLoading } = useAvatarRefresh(userId, filePath);
  const [fadeIn, setFadeIn] = useState(false);
  const { lastUpdate } = useAvatar();
  const [imgKey, setImgKey] = useState(Date.now());

  // Reset the key when lastUpdate changes to force a re-render
  useEffect(() => {
    setImgKey(Date.now());
    setFadeIn(false);
    setTimeout(() => setFadeIn(true), 50);
  }, [lastUpdate]);

  return (
    <Avatar className={className} onClick={onClick}>
      {avatarUrl ? (
        <div
          key={imgKey}
          className={`w-full h-full transition-opacity duration-300 ${
            fadeIn ? "opacity-100" : "opacity-0"
          }`}
          style={{
            backgroundImage: `url("${avatarUrl}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          onLoad={() => setFadeIn(true)}
          onError={() => console.warn("Failed to load avatar image")}
        />
      ) : null}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
};

export default DirectAvatarImage;
