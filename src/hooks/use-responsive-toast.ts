import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useMobileToast } from "@/components/ui/mobile-toast";

type ToastOptions = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

/**
 * A responsive toast hook that uses the mobile toast on small screens
 * and the desktop toast on larger screens.
 *
 * @returns A toast function that automatically picks the right toast implementation
 */
export function useResponsiveToast() {
  const { toast } = useToast();
  const { showToast: showMobileToast } = useMobileToast();
  const [isMobile, setIsMobile] = useState(false);

  // Debounce mechanism
  const toastTimeoutRef = useRef<number | null>(null);
  const lastToastRef = useRef<string | null>(null);

  // Debounce period in ms (300ms is typically a good value)
  const DEBOUNCE_PERIOD = 300;

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // Matches the md breakpoint in Tailwind
    };

    // Initial check
    checkIfMobile();

    // Set up listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
      // Clear any pending timeouts
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Return a function that chooses the right toast based on screen size
  const responsiveToast = (options: ToastOptions) => {
    // Create a hash of the toast content to identify duplicates
    const toastHash = `${options.title}-${options.description}-${
      options.variant || "default"
    }`;

    // If this is the same toast as the last one and it's too soon, don't show it
    if (lastToastRef.current === toastHash && toastTimeoutRef.current) {
      return;
    }

    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    // Store this toast as the last one shown
    lastToastRef.current = toastHash;

    // Set a timeout to clear the last toast reference
    toastTimeoutRef.current = window.setTimeout(() => {
      lastToastRef.current = null;
      toastTimeoutRef.current = null;
    }, DEBOUNCE_PERIOD);

    if (isMobile) {
      // Map variants between the two systems
      let mobileVariant: "default" | "success" | "error" | "warning" | "info" =
        "default";

      if (options.variant === "destructive") {
        mobileVariant = "error";
      } else if (options.variant === "default") {
        mobileVariant = "success";
      }

      return showMobileToast({
        title: options.title,
        message: options.description,
        variant: mobileVariant,
        duration: 5000, // 5 seconds
      });
    } else {
      // Use the desktop toast on larger screens
      return toast({
        title: options.title,
        description: options.description,
        variant: options.variant,
      });
    }
  };

  return { toast: responsiveToast };
}
