import {
  Bell,
  Search,
  PlusCircle,
  Menu,
  Calendar,
  Bookmark,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAvatar } from "@/contexts/AvatarContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useToast } from "@/components/ui/use-toast";
import AddJobModal from "@/components/jobs/AddJobModal";
import { JobApplication } from "@/data/mockJobs";
import { supabase } from "@/lib/supabase";

// Set to false to disable verbose logging in production
const DEBUG = false;

// Debug logger that only logs in development mode
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log(...args);
  }
};

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [avatarFadeIn, setAvatarFadeIn] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const previousUserId = useRef<string | null>(null);
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { lastUpdate } = useAvatar();
  const { toast } = useToast();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const isMounted = useRef(true);

  // Get the 3 most recent notifications - memoize to prevent recalculation
  const recentNotifications = useMemo(() => {
    return notifications.slice(0, 3);
  }, [notifications]);

  // Memoize the time ago function to only re-create when needed
  const getTimeAgo = useCallback((date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return Math.floor(seconds) + " seconds ago";
  }, []);

  // Fetch user's avatar when component mounts or when avatar is updated
  useEffect(() => {
    let isActive = true; // Track if the component is still mounted
    let fetchTimeout: number | null = null;

    const fetchUserAvatar = async () => {
      // Prevent multiple simultaneous fetches
      if (!isActive) return;

      try {
        // Skip if no user or same user (unless it's an explicit avatar update)
        if (!user?.id) {
          setAvatarUrl(null);
          setAvatarLoading(false);
          setAvatarFadeIn(false);
          return;
        }

        // Create a unique reference for this fetch operation
        const fetchId = Date.now();
        debugLog(`[${fetchId}] Starting avatar fetch for user ${user.id}`);

        // Avoid duplicate fetches for same data
        const isAvatarUpdateTrigger =
          previousUserId.current === user.id && lastUpdate;
        const isFreshUser = previousUserId.current !== user.id;

        // Use sessionStorage to cache avatar URL to minimize refetches
        const cachedAvatarUrl = sessionStorage.getItem(`avatar_${user.id}`);
        const cachedTimestamp = sessionStorage.getItem(
          `avatar_timestamp_${user.id}`
        );
        const cacheAge = cachedTimestamp
          ? Date.now() - parseInt(cachedTimestamp, 10)
          : null;

        // If we have a cached URL, use it unless it's stale (older than 5 minutes) or an update was triggered
        if (
          cachedAvatarUrl &&
          cacheAge &&
          cacheAge < 5 * 60 * 1000 && // 5 minutes
          !isAvatarUpdateTrigger
        ) {
          debugLog(`[${fetchId}] Using cached avatar URL from sessionStorage`);
          setAvatarUrl(cachedAvatarUrl);
          setAvatarLoading(false);
          return;
        }

        // Skip fetching if already have the avatar and no explicit update was triggered
        if (
          previousUserId.current === user.id &&
          !isAvatarUpdateTrigger &&
          avatarUrl &&
          !avatarLoading
        ) {
          debugLog(`[${fetchId}] Using cached avatar, skipping fetch`);
          return;
        }

        if (!isActive) return; // Check again before setting loading state

        setAvatarLoading(true);
        setAvatarFadeIn(false);
        previousUserId.current = user.id;

        // Get the user's profile - only fetch the avatar_url field
        const { data, error } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();

        if (!isActive) return; // Check if still mounted

        if (error) {
          console.error(`[${fetchId}] Error fetching profile:`, error);
          setAvatarLoading(false);
          return;
        }

        if (!data?.avatar_url) {
          debugLog(`[${fetchId}] No avatar URL found in profile`);
          setAvatarUrl(null);
          setAvatarLoading(false);
          return;
        }

        // Get the public URL for the avatar
        const { data: urlData } = await supabase.storage
          .from("avatars")
          .getPublicUrl(data.avatar_url);

        if (!isActive) return; // Check if still mounted

        // If we don't have a URL, bail out
        if (!urlData?.publicUrl) {
          debugLog(`[${fetchId}] No public URL returned from storage`);
          setAvatarUrl(null);
          setAvatarLoading(false);
          return;
        }

        // Add cache busting query parameter to force refresh
        const cacheBustUrl = `${urlData.publicUrl}?t=${
          isAvatarUpdateTrigger ? lastUpdate : Date.now()
        }`;
        debugLog(`[${fetchId}] Setting navbar avatar URL:`, cacheBustUrl);

        // Store in sessionStorage
        sessionStorage.setItem(`avatar_${user.id}`, cacheBustUrl);
        sessionStorage.setItem(
          `avatar_timestamp_${user.id}`,
          Date.now().toString()
        );

        // Set the URL and let the image handle loading
        setAvatarUrl(cacheBustUrl);
      } catch (error) {
        console.error("Exception fetching avatar:", error);
        if (isActive) {
          setAvatarLoading(false);
          setAvatarFadeIn(false);
        }
      }
    };

    // Debounce the fetch to prevent multiple simultaneous requests
    if (fetchTimeout) {
      window.clearTimeout(fetchTimeout);
    }

    // Use a short timeout to debounce rapid auth state changes
    fetchTimeout = window.setTimeout(fetchUserAvatar, 200);

    // Cleanup function
    return () => {
      isActive = false; // Mark component as unmounted
      isMounted.current = false;
      if (fetchTimeout) {
        window.clearTimeout(fetchTimeout);
      }
    };
  }, [user?.id, lastUpdate]); // Only depend on user ID and lastUpdate, not the entire user object

  // Listen for avatar update events
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      debugLog("Navbar: Received avatar-updated event");
      // We don't need to manually set avatar loading state here
      // The effect with lastUpdate dependency will automatically trigger
      // and handle the refresh properly
    };

    // Add event listener
    window.addEventListener(
      "avatar-updated",
      handleAvatarUpdate as EventListener
    );

    // Clean up
    return () => {
      window.removeEventListener(
        "avatar-updated",
        handleAvatarUpdate as EventListener
      );
    };
  }, []);

  // Memoize user initials calculation to prevent recalculation on every render
  const initials = useMemo(() => {
    if (!user) return "U";

    const userMeta = user.user_metadata;

    if (userMeta && userMeta.first_name && userMeta.last_name) {
      return `${userMeta.first_name.charAt(0)}${userMeta.last_name.charAt(
        0
      )}`.toUpperCase();
    }

    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return "U";
  }, [user]);

  // Memoize user display name calculation to prevent recalculation on every render
  const userDisplayName = useMemo(() => {
    if (!user) return "User";

    const userMeta = user.user_metadata;

    if (userMeta && userMeta.first_name && userMeta.last_name) {
      return `${userMeta.first_name} ${userMeta.last_name}`;
    }

    return user.email?.split("@")[0] || "User";
  }, [user]);

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

  const handleAddJob = useCallback(
    (job: JobApplication) => {
      // Here you would typically save the job to your backend/API
      toast({
        title: "Job Added",
        description: `Successfully added ${job.position} at ${job.company}`,
      });

      // Navigate to the applications page to see the newly added job
      navigate("/applications");
    },
    [navigate, toast]
  );

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
            {isAuthenticated && (
              <>
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

                <DropdownMenu
                  open={notificationsOpen}
                  onOpenChange={setNotificationsOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative text-slate-500 hover:bg-slate-100 rounded-full w-9 h-9 p-0"
                    >
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="flex items-center justify-between p-4 pb-2">
                      <h3 className="font-medium">Notifications</h3>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => markAllAsRead()}
                        >
                          Mark all as read
                        </Button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No notifications yet
                      </div>
                    ) : (
                      <>
                        {recentNotifications.map((notification) => (
                          <DropdownMenuItem
                            key={notification.id}
                            className={`p-4 border-b border-slate-100 cursor-pointer ${
                              !notification.read
                                ? "bg-blue-50 hover:bg-blue-100"
                                : ""
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex gap-3">
                              <div
                                className={`w-2 h-2 rounded-full mt-2 ${
                                  !notification.read
                                    ? "bg-blue-600"
                                    : "bg-transparent"
                                }`}
                              ></div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {notification.title}
                                </div>
                                <div className="text-sm text-slate-500 line-clamp-2">
                                  {notification.description}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                  {notification.date
                                    ? getTimeAgo(notification.date)
                                    : ""}
                                </div>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="p-3 text-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                          onClick={() => {
                            setNotificationsOpen(false);
                            navigate("/notifications");
                          }}
                        >
                          View all notifications
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full overflow-hidden"
                    >
                      <Avatar className="h-8 w-8 border border-slate-200">
                        {avatarUrl ? (
                          <AvatarImage
                            src={avatarUrl}
                            alt="Profile"
                            className="transition-opacity duration-300"
                            style={{ opacity: avatarFadeIn ? 1 : 0 }}
                            onLoad={() => {
                              if (!avatarFadeIn) {
                                console.log(
                                  "Navbar avatar loaded successfully"
                                );
                                setAvatarLoading(false);
                                setTimeout(() => setAvatarFadeIn(true), 50);
                              }
                            }}
                            onError={(e) => {
                              console.error("Error loading navbar avatar:", e);
                              setAvatarLoading(false);
                              setAvatarFadeIn(false);
                            }}
                          />
                        ) : null}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-2 text-center border-b border-slate-100">
                      <Avatar className="h-16 w-16 mx-auto mb-2 border border-slate-200">
                        {avatarUrl ? (
                          <AvatarImage
                            src={avatarUrl}
                            alt="Profile"
                            className="transition-opacity duration-300"
                            style={{ opacity: avatarFadeIn ? 1 : 0 }}
                            onLoad={() => {
                              if (!avatarFadeIn) {
                                console.log(
                                  "Dropdown avatar loaded successfully"
                                );
                                setAvatarLoading(false);
                                setTimeout(() => setAvatarFadeIn(true), 50);
                              }
                            }}
                            onError={(e) => {
                              console.error(
                                "Error loading dropdown avatar:",
                                e
                              );
                              setAvatarLoading(false);
                              setAvatarFadeIn(false);
                            }}
                          />
                        ) : null}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{userDisplayName}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {user?.email}
                      </div>
                    </div>
                    <DropdownMenuItem
                      onClick={() => navigate("/")}
                      className="p-2 cursor-pointer"
                    >
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/settings")}
                      className="p-2 cursor-pointer"
                    >
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/settings/integrations")}
                      className="p-2 cursor-pointer"
                    >
                      Integrations
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="p-2 text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {!isAuthenticated && (
              <div className="flex items-center gap-2">
                <Link to="/help/browser-extension">
                  <Button variant="ghost" size="sm" className="text-slate-500">
                    <Info className="h-4 w-4 mr-1" />
                    Browser Extension
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 md:hidden hover:bg-slate-100 rounded-full w-9 h-9 p-0"
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
