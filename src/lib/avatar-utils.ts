import { supabase } from "@/lib/supabase";

/**
 * Force reload all avatar images across the app
 */
export function forceReloadAllAvatars() {
  // Clear all caches
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.startsWith("avatar_") || key.includes("avatar"))) {
      sessionStorage.removeItem(key);
    }
  }

  // Clear localStorage avatar cache
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith("avatar_") || key.includes("avatar"))) {
      localStorage.removeItem(key);
    }
  }

  // Set a new timestamp in localStorage to trigger updates
  localStorage.setItem("avatar_last_update", Date.now().toString());

  // Dispatch event to notify all components
  const event = new CustomEvent("avatar-force-reload", {
    detail: { timestamp: Date.now() },
  });
  window.dispatchEvent(event);

  // Also dispatch the other events for backward compatibility
  const avatarUpdateEvent = new CustomEvent("avatar-updated", {
    detail: { timestamp: Date.now() },
  });
  window.dispatchEvent(avatarUpdateEvent);
}

/**
 * Extract the file path from a Supabase storage URL
 */
export function extractFilePath(url: string): string | null {
  if (!url) return null;

  try {
    // Remove any query parameters
    const cleanUrl = url.split("?")[0];

    // Extract the path after the storage/avatars part
    if (cleanUrl.includes("/storage/v1/object/public/avatars/")) {
      const parts = cleanUrl.split("/storage/v1/object/public/avatars/");
      if (parts.length > 1) {
        return parts[1];
      }
    }

    return null;
  } catch (error) {
    console.error("Error extracting file path from URL:", error);
    return null;
  }
}

/**
 * Get a fresh image URL with cache busting
 */
export function getFreshAvatarUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    const filePath = extractFilePath(url);

    if (filePath) {
      // Get a fresh URL from Supabase
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      if (data?.publicUrl) {
        // Add cache busting parameter
        return `${data.publicUrl}?nocache=${Date.now()}`;
      }
    }

    // If we couldn't extract the file path, just add a cache busting parameter
    return `${url}?nocache=${Date.now()}`;
  } catch (error) {
    console.error("Error getting fresh avatar URL:", error);
    return url;
  }
}
