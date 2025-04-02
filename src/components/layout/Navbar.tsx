import { BriefcaseBusiness, PlusCircle, Bell, Moon, Sun, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface NavbarProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  country: "USA" | "UK";
  setCountry: (value: "USA" | "UK") => void;
}

const Navbar = ({ isDarkMode, setIsDarkMode, country, setCountry }: NavbarProps) => {
  return (
    <div className="bg-white dark:bg-jobtrakr-darkcharcoal border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <BriefcaseBusiness className="h-6 w-6 text-jobtrakr-blue mr-2" />
          <h1 className="text-xl font-bold text-jobtrakr-charcoal dark:text-white">JobTrakr</h1>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <button className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Find Jobs
          </button>
          <button className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Messages
          </button>
          <button className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Community
          </button>
          <button className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            FAQ
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Country Toggle */}
          <div className="hidden sm:flex items-center">
            <ToggleGroup type="single" value={country} onValueChange={(value) => value && setCountry(value as "USA" | "UK")}>
              <ToggleGroupItem value="USA" size="sm" className="text-xs rounded-l-full rounded-r-none border-r-0">
                USA
              </ToggleGroupItem>
              <ToggleGroupItem value="UK" size="sm" className="text-xs rounded-r-full rounded-l-none">
                UK
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {/* Dark Mode Toggle - Keep this but make it subtle */}
          <div className="hidden sm:flex items-center">
            <Switch 
              checked={isDarkMode}
              onCheckedChange={setIsDarkMode}
              aria-label="Toggle dark mode"
              className="data-[state=checked]:bg-jobtrakr-blue"
            />
          </div>
          
          <Button variant="ghost" size="sm" className="hidden sm:flex dark:text-white">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Job
          </Button>
          
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-500 dark:text-gray-300 cursor-pointer" />
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
            <DropdownMenuContent align="end" className="dark:bg-jobtrakr-cardDark dark:text-white dark:border-gray-800">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              
              {/* Mobile-only country selector */}
              <DropdownMenuItem className="sm:hidden flex gap-2 items-center">
                <Globe className="h-4 w-4" />
                <ToggleGroup type="single" value={country} onValueChange={(value) => value && setCountry(value as "USA" | "UK")}>
                  <ToggleGroupItem value="USA" size="sm" className="text-xs">
                    USA
                  </ToggleGroupItem>
                  <ToggleGroupItem value="UK" size="sm" className="text-xs">
                    UK
                  </ToggleGroupItem>
                </ToggleGroup>
              </DropdownMenuItem>
              
              {/* Mobile-only dark mode toggle */}
              <DropdownMenuItem className="sm:hidden flex justify-between">
                Dark Mode
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={isDarkMode}
                    onCheckedChange={setIsDarkMode}
                    aria-label="Toggle dark mode"
                  />
                </div>
              </DropdownMenuItem>
              
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
