
import { ReactNode, useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [country, setCountry] = useState<"USA" | "UK">("USA");

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    // Check localStorage first
    const savedMode = localStorage.getItem("darkMode");
    const savedCountry = localStorage.getItem("country") as "USA" | "UK";
    
    if (savedMode !== null) {
      setIsDarkMode(savedMode === "true");
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(prefersDark);
    }

    // Set country preference
    if (savedCountry) {
      setCountry(savedCountry);
    }
  }, []);

  // Update localStorage and document class when dark mode changes
  useEffect(() => {
    localStorage.setItem("darkMode", isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Update localStorage when country changes
  useEffect(() => {
    localStorage.setItem("country", country);
  }, [country]);

  return (
    <div className="min-h-screen bg-jobtrakr-lightgray dark:bg-jobtrakr-charcoal">
      <Navbar 
        isDarkMode={isDarkMode} 
        setIsDarkMode={setIsDarkMode} 
        country={country}
        setCountry={setCountry}
      />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto dark:text-white">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
