import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAvatar } from "@/contexts/AvatarContext";
import { forceReloadAllAvatars } from "@/lib/avatar-utils";

/**
 * Custom hook to get a constantly refreshed avatar URL
 * This hook will handle all caching and refreshing automatically
 */
export function useAvatarRefresh(
  userId: string | undefined,
  filePath: string | undefined | null
) {
  const { lastUpdate } = useAvatar();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(Date.now());

  // Force a fresh reload
  const forceRefresh = () => {
    setKey(Date.now());
    setIsLoading(true);
    // Use the utility function to reload all avatars
    forceReloadAllAvatars();
  };

  // Effect to load and refresh the avatar
  useEffect(() => {
    if (!userId || !filePath) {
      setAvatarUrl(null);
      setIsLoading(false);
      return;
    }

    // Create a cache key for this avatar
    const cacheKey = `direct_avatar_${userId}`;
    const timestampKey = `direct_avatar_timestamp_${userId}`;

    // Check if we have a recent cached version
    const cachedUrl = sessionStorage.getItem(cacheKey);
    const cachedTimestamp = sessionStorage.getItem(timestampKey);

    // If we have a recently cached URL, use it
    if (cachedUrl && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp, 10);
      if (!isNaN(timestamp) && Date.now() - timestamp < 30000) {
        // 30 seconds
        setAvatarUrl(`${cachedUrl}?t=${key}`);
        setIsLoading(false);
        return;
      }
    }

    // Otherwise, get a fresh URL
    const fetchAvatar = async () => {
      try {
        // Get a fresh URL from Supabase
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        if (data?.publicUrl) {
          // Create a cache-busting URL
          const url = `${data.publicUrl}?t=${key}`;

          // Store in session storage
          sessionStorage.setItem(cacheKey, data.publicUrl);
          sessionStorage.setItem(timestampKey, Date.now().toString());

          setAvatarUrl(url);
        } else {
          setAvatarUrl(null);
        }
      } catch (error) {
        console.error("Error loading avatar:", error);
        setAvatarUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatar();
  }, [userId, filePath, key, lastUpdate]);

  return { avatarUrl, isLoading, forceRefresh };
}
