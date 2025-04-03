import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * A reusable layout component for authentication pages with a wave background
 */
export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        backgroundColor: "#e6f0ff", // Light blue fallback
        backgroundImage: "url('/images/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-full max-w-md z-10">{children}</div>
    </div>
  );
};
