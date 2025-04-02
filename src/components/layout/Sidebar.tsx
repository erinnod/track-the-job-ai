
import { 
  LayoutDashboard, 
  Briefcase, 
  Kanban, 
  BarChart, 
  FileText, 
  Calendar, 
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface SidebarLinkProps {
  icon: React.ElementType;
  label: string;
  to: string;
  active?: boolean;
}

const SidebarLink = ({ icon: Icon, label, to, active }: SidebarLinkProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center space-x-3 px-4 py-2 rounded-md transition-colors",
        active 
          ? "bg-blue-50 text-blue-700" 
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-64px)] pt-6 hidden md:block">
      <div className="px-4 mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
          Main
        </h2>
        <nav className="space-y-1">
          <SidebarLink 
            icon={LayoutDashboard} 
            label="Dashboard" 
            to="/" 
            active 
          />
          <SidebarLink 
            icon={Briefcase} 
            label="My Applications" 
            to="/applications" 
          />
          <SidebarLink 
            icon={Kanban} 
            label="Kanban Board" 
            to="/kanban" 
          />
        </nav>
      </div>
      
      <div className="px-4 mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
          Tools
        </h2>
        <nav className="space-y-1">
          <SidebarLink 
            icon={FileText} 
            label="Documents" 
            to="/documents" 
          />
          <SidebarLink 
            icon={Calendar} 
            label="Calendar" 
            to="/calendar" 
          />
          <SidebarLink 
            icon={BarChart} 
            label="Analytics" 
            to="/analytics" 
          />
        </nav>
      </div>
      
      <div className="px-4 mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
          Settings
        </h2>
        <nav className="space-y-1">
          <SidebarLink 
            icon={Settings} 
            label="Settings" 
            to="/settings" 
          />
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
