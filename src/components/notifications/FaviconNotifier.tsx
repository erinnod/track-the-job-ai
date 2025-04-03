import { useEffect } from "react";
import { useNotifications } from "@/contexts/NotificationContext";

/**
 * Component that updates the favicon with a notification badge when there are unread notifications
 */
const FaviconNotifier = () => {
  const { unreadCount } = useNotifications();

  useEffect(() => {
    // Find the favicon link element
    const favicon = document.querySelector(
      "link[rel='icon']"
    ) as HTMLLinkElement;
    if (!favicon) return;

    // Store the original favicon URL
    const originalFavicon = favicon.href;

    // Only update if there are unread notifications
    if (unreadCount > 0) {
      // Create a canvas to draw the notification badge
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Load the original favicon image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = originalFavicon;

      img.onload = () => {
        // Draw the original favicon
        ctx.drawImage(img, 0, 0, 32, 32);

        // Draw the notification badge (red circle)
        ctx.beginPath();
        ctx.arc(24, 8, 8, 0, 2 * Math.PI);
        ctx.fillStyle = "#e11d48"; // Red color
        ctx.fill();

        // Draw the count
        ctx.font = "bold 12px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(unreadCount > 9 ? "9+" : unreadCount.toString(), 24, 8);

        // Set the favicon with the notification badge
        favicon.href = canvas.toDataURL("image/png");
      };
    } else {
      // Reset to original favicon when no unread notifications
      favicon.href = originalFavicon;
    }

    // Cleanup function
    return () => {
      favicon.href = originalFavicon;
    };
  }, [unreadCount]);

  // This component doesn't render anything
  return null;
};

export default FaviconNotifier;
