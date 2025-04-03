import { Bell, Search, PlusCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAvatar } from "@/contexts/AvatarContext";
import { useToast } from "@/components/ui/use-toast";
import AddJobModal from "@/components/jobs/AddJobModal";
import { JobApplication } from "@/data/mockJobs";
import { supabase } from "@/lib/supabase";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { lastUpdate } = useAvatar();
  const { toast } = useToast();

  // Fetch user's avatar when component mounts or when avatar is updated
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user?.id) return;

      try {
        // Get the user's profile
        const { data, error } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        if (data?.avatar_url) {
          // Get the public URL for the avatar
          const { data: urlData } = await supabase.storage
            .from("avatars")
            .getPublicUrl(data.avatar_url);

          if (urlData?.publicUrl) {
            // Add cache busting query parameter to force refresh
            const cacheBustUrl = `${urlData.publicUrl}?t=${Date.now()}`;
            setAvatarUrl(cacheBustUrl);
          }
        }
      } catch (error) {
        console.error("Exception fetching avatar:", error);
      }
    };

    fetchUserAvatar();
  }, [user, lastUpdate]); // Re-run when user changes or when avatar is updated

  const getInitials = () => {
    if (!user) return "U";

    const userMeta = user.user_metadata;
    console.log("User metadata for initials:", userMeta);

    if (userMeta && userMeta.first_name && userMeta.last_name) {
      return `${userMeta.first_name.charAt(0)}${userMeta.last_name.charAt(
        0
      )}`.toUpperCase();
    }

    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return "U";
  };

  const getUserDisplayName = () => {
    if (!user) return "User";

    const userMeta = user.user_metadata;
    console.log("User metadata for display name:", userMeta);

    if (userMeta && userMeta.first_name && userMeta.last_name) {
      return `${userMeta.first_name} ${userMeta.last_name}`;
    }

    return user.email?.split("@")[0] || "User";
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddJob = (job: JobApplication) => {
    // Here you would typically save the job to your backend/API
    toast({
      title: "Job Added",
      description: `Successfully added ${job.position} at ${job.company}`,
    });

    // Navigate to the applications page to see the newly added job
    navigate("/applications");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white">
      <div className="mx-auto">
        <div className="flex items-center justify-between h-16 px-6 md:px-12 lg:px-16 border-b border-slate-200">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img
                src="/images/jobtrakr-logo.png"
                alt="JobTrakr Logo"
                className="h-9"
                style={{ width: "auto" }}
              />
            </Link>
          </div>

          {/* Center navigation */}
          <nav className="hidden md:flex items-center">
            {/* Messages and Community links removed */}
          </nav>

          {/* Right section: search, add job, notifications, avatar */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hidden sm:flex hover:bg-slate-100 rounded-full w-9 h-9 p-0"
              onClick={() => {}}
            >
              <Search className="h-4 w-4" />
            </Button>

            <div className="hidden sm:block">
              <AddJobModal onAddJob={handleAddJob} />
            </div>

            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:bg-slate-100 rounded-full w-9 h-9 p-0 relative"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">
                  3
                </span>
              </Button>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-blue-500 transition-all">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt="Profile picture" />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-medium text-sm">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 p-2 mt-2 z-50 rounded-lg shadow-lg animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2"
                >
                  <div className="flex items-center gap-3 p-2 border-b border-slate-100 pb-3 mb-1">
                    <Avatar className="h-10 w-10">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt="Profile" />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-800 leading-tight">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-slate-500 leading-tight mt-0.5">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 rounded-md transition-colors my-1 p-2 text-sm"
                    onClick={() => navigate("/settings")}
                  >
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600 hover:text-red-700 rounded-md transition-colors my-1 p-2 text-sm mt-1"
                    onClick={handleLogout}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="text-slate-600 hover:text-blue-600 hover:bg-slate-50 text-sm font-medium"
                >
                  Sign In
                </Button>
                <Button
                  variant="default"
                  onClick={() => navigate("/signup")}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  Sign Up
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-slate-500 hover:bg-slate-100 rounded-full w-9 h-9 p-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-md animate-in slide-in-from-top duration-200">
          <div className="px-6 py-4 space-y-2">
            {/* Messages and Community links removed */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-slate-50 py-2.5 px-3 h-auto rounded-md"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <div className="w-full pt-1">
              <AddJobModal onAddJob={handleAddJob} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
