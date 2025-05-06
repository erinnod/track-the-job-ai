import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAvatar } from "@/contexts/AvatarContext";
import { supabase } from "@/lib/supabase";

interface CacheBreakingAvatarProps {
  src: string | null;
  alt: string;
  fallback: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * A special avatar component that forces the browser to reload the image
 * by completely bypassing the browser cache
 */
const CacheBreakingAvatar: React.FC<CacheBreakingAvatarProps> = ({
  src,
  alt,
  fallback,
  className = "",
  onLoad,
  onError,
}) => {
  const { lastUpdate } = useAvatar();
  const [key, setKey] = useState(Date.now());
  const [inlineStyle, setInlineStyle] = useState({});
  const avatarRef = useRef<HTMLDivElement>(null);

  // Function to reload the image from scratch
  const reloadImage = async () => {
    // Create a totally new key to force re-render
    const newKey = Date.now();
    setKey(newKey);

    // If we don't have a valid src, just return
    if (!src) return;

    try {
      // Check if the URL is a Supabase storage URL (contains 'avatars')
      if (src.includes("avatars") && src.includes("storage")) {
        // Extract the file path from the URL - this is a bit hacky but should work
        // Remove any query parameters first
        const cleanSrc = src.split("?")[0];
        const parts = cleanSrc.split("/storage/v1/object/public/avatars/");

        if (parts.length > 1) {
          const filePath = parts[1];
          console.log("Reloading from storage path:", filePath);

          // Get a fresh URL directly from Supabase with cache busting
          const { data } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);

          if (data?.publicUrl) {
            // Create CSS with forced background image and cache buster
            const finalUrl = `${data.publicUrl}?nocache=${newKey}`;
            setInlineStyle({
              backgroundImage: `url("${finalUrl}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              width: "100%",
              height: "100%",
            });

            // Also force reload the image by creating a new image object
            const preloadImg = new Image();
            preloadImg.src = finalUrl;
            preloadImg.onload = () => {
              if (onLoad) onLoad();
            };
            preloadImg.onerror = () => {
              if (onError) onError();
            };
            return;
          }
        }
      }

      // Fallback approach for non-Supabase URLs or if extraction failed
      // Add a cache-busting query parameter
      const finalUrl = `${src}?t=${newKey}`;
      setInlineStyle({
        backgroundImage: `url("${finalUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        width: "100%",
        height: "100%",
      });

      // Preload the image
      const img = new Image();
      img.src = finalUrl;
      img.onload = () => {
        if (onLoad) onLoad();
      };
      img.onerror = () => {
        if (onError) onError();
      };
    } catch (error) {
      console.error("Error loading avatar image:", error);
      if (onError) onError();
    }
  };

  // Force reload when lastUpdate changes or component mounts
  useEffect(() => {
    reloadImage();
  }, [lastUpdate, src]); // Reload when lastUpdate changes or src changes

  // If the element is visible, periodically check for updates
  useEffect(() => {
    // Create an intersection observer to detect if avatar is visible
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Only reload if visible
          reloadImage();
        }
      },
      { threshold: 0.1 }
    );

    if (avatarRef.current) {
      observer.observe(avatarRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Avatar className={className} ref={avatarRef}>
      {src && Object.keys(inlineStyle).length > 0 ? (
        <div style={inlineStyle} data-key={key} />
      ) : null}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
};

export default CacheBreakingAvatar;
