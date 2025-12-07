import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import {
  Calendar,
  Bookmark,
  Info,
  Bell,
  Check,
  CheckCheck,
  X,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useNotifications } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { fixInterviewNotifications } from "@/utils/fixNotifications";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";

const Notifications = () => {
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    toggleReadStatus,
    deleteNotification,
    loading,
  } = useNotifications();

  // Run the fix for interview notifications when the component mounts
  useEffect(() => {
    if (user) {
      // Run the fix in the background
      fixInterviewNotifications(user.id).then((result) => {
        if (result.success && result.message.includes("Updated")) {
          console.log(result.message);
          // Only show toast if we actually updated some notifications
          toast({
            title: "Notifications updated",
            description: "Your interview notifications have been fixed.",
          });
        }
      });
    }
  }, [user, toast]);

  const getFilteredNotifications = () => {
    if (activeTab === "all") return notifications;
    if (activeTab === "unread") return notifications.filter((n) => !n.read);
    if (activeTab === "interview")
      return notifications.filter((n) => n.type === "interview");
    if (activeTab === "application")
      return notifications.filter((n) => n.type === "application");
    if (activeTab === "jobMatch")
      return notifications.filter((n) => n.type === "jobMatch");
    return notifications;
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast({
      title: "All notifications marked as read",
      description: "Your notifications have been updated",
    });
  };

  const handleDeleteNotification = (id: string) => {
    deleteNotification(id);
    toast({
      title: "Notification removed",
      description: "The notification has been deleted",
    });
  };

  const getTimeAgo = (date: Date) => {
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
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "interview":
        return <Calendar className="h-4 w-4" />;
      case "application":
        return <Bookmark className="h-4 w-4" />;
      case "jobMatch":
        return <Info className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case "interview":
        return "bg-blue-100 text-blue-600";
      case "application":
        return "bg-green-100 text-green-600";
      case "jobMatch":
        return "bg-yellow-100 text-yellow-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-slate-500 mt-1">
            View and manage all your notifications
          </p>
        </div>

        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              All
              {notifications.length > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="interview">Interviews</TabsTrigger>
            <TabsTrigger value="application">Applications</TabsTrigger>
            <TabsTrigger value="jobMatch">Job Matches</TabsTrigger>
          </TabsList>

          {/* Content for all tabs */}
          <TabsContent value={activeTab} className="mt-0">
            <div className="flex justify-end mb-4 gap-2">
              {activeTab === "interview" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!user) return;

                          try {
                            const result = await fixInterviewNotifications(
                              user.id
                            );

                            if (result.success) {
                              // Check for any "no notification" messages
                              if (
                                result.message?.includes("No notifications") ||
                                result.message?.includes("No notification") ||
                                result.message?.includes("need updating")
                              ) {
                                toast({
                                  title: "No interviews found",
                                  description:
                                    "There are no interview notifications that need to be fixed.",
                                });
                              } else {
                                toast({
                                  title: "Notifications fixed",
                                  description:
                                    result.message ||
                                    "Your notifications have been updated.",
                                });
                                // Only reload the page if we actually updated something
                                window.location.reload();
                              }
                            } else {
                              console.error(
                                "Fix interview error:",
                                result.error
                              );
                              toast({
                                title: "No changes needed",
                                description:
                                  "There are no interview notifications that need to be fixed.",
                              });
                            }
                          } catch (error) {
                            console.error("Fix interview exception:", error);
                            toast({
                              title: "No changes needed",
                              description:
                                "There are no interview notifications that need to be fixed.",
                            });
                          }
                        }}
                        className="text-sm flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Fix interview notifications
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Scans for interview-related notifications that may have
                        been incorrectly categorized and fixes their type
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {notifications.filter((n) => !n.read).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-sm flex items-center gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
                </Button>
              )}
            </div>

            <ScrollArea className="h-[calc(100vh-300px)] min-h-[400px]">
              <AnimatePresence>
                {loading ? (
                  // Skeleton loaders
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex gap-4 p-4 border rounded-lg">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-2/5" />
                          <Skeleton className="h-3 w-4/5" />
                          <Skeleton className="h-3 w-1/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getFilteredNotifications().length === 0 ? (
                      <div className="text-center py-10 text-slate-500">
                        <Bell className="mx-auto h-10 w-10 opacity-20 mb-4" />
                        <p>
                          {activeTab === "all"
                            ? "No notifications yet"
                            : `No ${activeTab} notifications`}
                        </p>
                      </div>
                    ) : (
                      getFilteredNotifications().map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`p-4 border rounded-lg hover:shadow-sm transition-all ${
                            notification.read ? "bg-white" : "bg-blue-50"
                          }`}
                        >
                          <div className="flex gap-4">
                            <div
                              className={`${getColorForType(
                                notification.type
                              )} p-2 rounded-full h-10 w-10 flex items-center justify-center shrink-0`}
                            >
                              {getIconForType(notification.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h3 className="font-medium text-slate-800">
                                  {notification.title}
                                </h3>
                                <div className="flex gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                          onClick={() =>
                                            toggleReadStatus(notification.id)
                                          }
                                        >
                                          {notification.read ? (
                                            <Check className="h-4 w-4 text-slate-400" />
                                          ) : (
                                            <Check className="h-4 w-4 text-blue-500" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          {notification.read
                                            ? "Mark as unread"
                                            : "Mark as read"}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                                          onClick={() =>
                                            handleDeleteNotification(
                                              notification.id
                                            )
                                          }
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Delete notification</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                              <p className="text-sm text-slate-600 mt-1">
                                {notification.description}
                              </p>
                              <p className="text-xs text-slate-400 mt-2">
                                {getTimeAgo(notification.date)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Notifications;
