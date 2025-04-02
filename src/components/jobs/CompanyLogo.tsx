
import { Building } from "lucide-react";

interface CompanyLogoProps {
  company: string;
  logo?: string;
  size?: "sm" | "md" | "lg";
}

const CompanyLogo = ({ company, logo, size = "md" }: CompanyLogoProps) => {
  // Size classes
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };
  
  // Company initial
  const initial = company.charAt(0).toUpperCase();
  
  // Background colors based on company name
  const getBackgroundColor = () => {
    const colors = [
      "bg-blue-500", // Amazon blue
      "bg-red-500",  // Google red
      "bg-purple-500", // Dribbble purple
      "bg-indigo-500", // Twitter blue
      "bg-pink-500",  // Airbnb pink
      "bg-gray-500",  // Gray
    ];
    
    const index = company.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  return (
    <>
      {logo ? (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-white flex items-center justify-center p-1 border border-gray-100`}>
          <img 
            src={logo} 
            alt={`${company} logo`} 
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold ${getBackgroundColor()}`}>
          {initial}
        </div>
      )}
    </>
  );
};

export default CompanyLogo;
