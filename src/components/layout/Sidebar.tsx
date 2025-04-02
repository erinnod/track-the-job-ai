
import { 
  LayoutDashboard, 
  Briefcase, 
  Kanban, 
  BarChart, 
  FileText, 
  Calendar, 
  Settings, 
  Search,
  MessageSquare
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
        "flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors",
        active 
          ? "bg-[#5465FF] text-white" 
          : "text-gray-400 hover:text-white hover:bg-[#1A1F2C]"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  return (
    <div className="w-64 bg-[#131A2C] border-r border-[#242C44] h-[calc(100vh-64px)] pt-6 hidden sm:block">
      <div className="px-4 mb-6">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          Main
        </h2>
        <nav className="mt-3 space-y-1">
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
          <SidebarLink 
            icon={Search} 
            label="Job Search" 
            to="/search" 
          />
        </nav>
      </div>
      
      <div className="px-4 mb-6">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          Tools
        </h2>
        <nav className="mt-3 space-y-1">
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
            icon={MessageSquare} 
            label="Messages" 
            to="/messages" 
          />
          <SidebarLink 
            icon={BarChart} 
            label="Analytics" 
            to="/analytics" 
          />
        </nav>
      </div>
      
      <div className="px-4 mb-6">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          Settings
        </h2>
        <nav className="mt-3 space-y-1">
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
