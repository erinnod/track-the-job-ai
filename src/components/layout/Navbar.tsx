
import { BriefcaseBusiness, PlusCircle, Bell } from "lucide-react";
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
      <div className="flex items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <BriefcaseBusiness className="h-8 w-8 text-jobtrakr-blue mr-2" />
          <h1 className="text-2xl font-bold text-jobtrakr-charcoal">JobTrakr</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Job
          </Button>
          
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-500 cursor-pointer" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-jobtrakr-blue text-white text-xs flex items-center justify-center">
              3
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="bg-jobtrakr-blue text-white">
                  AL
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
