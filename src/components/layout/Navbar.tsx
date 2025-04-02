
import { Briefcase, Bell, Search, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Briefcase className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-xl font-bold text-gray-900">JobTrakr</h1>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <button className="text-gray-600 hover:text-gray-900">
            Find Jobs
          </button>
          <button className="text-gray-600 hover:text-gray-900">
            Messages
          </button>
          <button className="text-gray-600 hover:text-gray-900">
            Community
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="text-gray-600">
            <Search className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Job
          </Button>
          
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-600 cursor-pointer" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
              3
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  JD
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
