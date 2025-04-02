
import { Briefcase, Bell, Search, PlusCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <Briefcase className="h-6 w-6 text-blue-600 mr-2" />
            <h1 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">JobTrakr</h1>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <button className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
            Find Jobs
          </button>
          <button className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
            Messages
          </button>
          <button className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
            Community
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="text-gray-600 hidden sm:flex hover:bg-gray-100 hover:text-blue-600 rounded-full">
            <Search className="h-5 w-5" />
          </Button>
          
          <Button variant="outline" size="sm" className="hidden sm:flex text-blue-600 border-blue-600 hover:bg-blue-50 rounded-full">
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Job
          </Button>
          
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shadow-sm">
              3
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 cursor-pointer border-2 border-gray-200 hover:border-blue-200 transition-colors">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                  JD
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 mt-1 z-50">
              <div className="flex flex-col space-y-1 p-2">
                <p className="font-medium">John Doe</p>
                <p className="text-sm text-gray-500">john.doe@example.com</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
                onClick={() => navigate('/settings')}
              >
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 text-red-500 hover:text-red-600">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="md:hidden text-gray-600 hover:bg-gray-100" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 shadow-md">
          <div className="space-y-3">
            <button className="block w-full text-left py-2 text-gray-600 hover:text-blue-600 font-medium">
              Find Jobs
            </button>
            <button className="block w-full text-left py-2 text-gray-600 hover:text-blue-600 font-medium">
              Messages
            </button>
            <button className="block w-full text-left py-2 text-gray-600 hover:text-blue-600 font-medium">
              Community
            </button>
            <Button variant="outline" size="sm" className="w-full justify-start text-gray-600 hover:bg-gray-100">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="default" size="sm" className="w-full justify-start bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Job
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
