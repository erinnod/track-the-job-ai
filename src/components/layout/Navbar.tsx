
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
    <div className="bg-white dark:bg-jobtrakr-charcoal border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <BriefcaseBusiness className="h-8 w-8 text-jobtrakr-blue mr-2" />
          <h1 className="text-2xl font-bold text-jobtrakr-charcoal dark:text-white">JobTrakr</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Country Toggle */}
          <div className="hidden sm:flex items-center space-x-2">
            <Globe className="h-4 w-4 text-gray-500 dark:text-gray-300" />
            <ToggleGroup type="single" value={country} onValueChange={(value) => value && setCountry(value as "USA" | "UK")}>
              <ToggleGroupItem value="USA" size="sm" className="text-xs">
                USA
              </ToggleGroupItem>
              <ToggleGroupItem value="UK" size="sm" className="text-xs">
                UK
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {/* Dark Mode Toggle */}
          <div className="hidden sm:flex items-center space-x-2">
            <Sun className="h-4 w-4 text-gray-500 dark:text-gray-300" />
            <Switch 
              checked={isDarkMode}
              onCheckedChange={setIsDarkMode}
              aria-label="Toggle dark mode"
            />
            <Moon className="h-4 w-4 text-gray-500 dark:text-gray-300" />
          </div>
          
          <Button variant="outline" size="sm" className="hidden sm:flex dark:border-gray-700 dark:text-white">
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
            <DropdownMenuContent align="end" className="dark:bg-gray-800 dark:text-white dark:border-gray-700">
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
