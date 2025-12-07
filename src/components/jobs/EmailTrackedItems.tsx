import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchTrackedEmails,
  syncEmails,
  matchEmailsToJobs,
} from "@/services/emailService";
import { TrackedEmail } from "@/types/email";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, RefreshCw, Link2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailTrackedItemsProps {
  limit?: number;
  onStatusChange?: () => void;
}

export default function EmailTrackedItems({
  limit = 5,
  onStatusChange,
}: EmailTrackedItemsProps) {
  const [emails, setEmails] = useState<TrackedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadEmails();
    }
  }, [user?.id]);

  const loadEmails = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const trackedEmails = await fetchTrackedEmails(user.id, limit);
      setEmails(trackedEmails);
    } catch (error) {
      console.error("Error loading tracked emails:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!user?.id) return;

    setIsSyncing(true);
    try {
      // First sync emails
      await syncEmails(user.id);

      // Then match them to jobs
      const matchCount = await matchEmailsToJobs(user.id);

      if (matchCount > 0 && onStatusChange) {
        onStatusChange();
      }

      // Reload emails to show latest
      await loadEmails();

      toast({
        title: "Email sync completed",
        description: `Successfully synced emails and matched ${matchCount} to your applications`,
      });
    } catch (error: any) {
      console.error("Error syncing emails:", error);
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync emails",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;

    const variants: Record<string, string> = {
      applied: "bg-blue-100 text-blue-800",
      interview: "bg-purple-100 text-purple-800",
      rejected: "bg-red-100 text-red-800",
      offer: "bg-green-100 text-green-800",
    };

    const labels: Record<string, string> = {
      applied: "Applied",
      interview: "Interview",
      rejected: "Rejected",
      offer: "Offer",
    };

    return <Badge className={variants[status]}>{labels[status]}</Badge>;
  };

  if (!user?.id) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              Please sign in to track emails
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              Email Tracked Updates
            </CardTitle>
            <CardDescription>
              Recent job status updates from your emails
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No tracked emails found</p>
            <p className="text-xs text-slate-400 mt-1">
              Connect your email to start tracking job updates
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {emails.map((email) => (
              <div
                key={email.id}
                className="p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-medium line-clamp-1">
                    {email.subject}
                  </h4>
                  {email.parsedStatus && getStatusBadge(email.parsedStatus)}
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  From: {email.sender.split("<")[0].trim()}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                  {email.snippet || "No preview available"}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(email.receivedAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {email.jobApplicationId && (
                    <div className="flex items-center text-xs text-primary">
                      <Link2 className="h-3 w-3 mr-1" />
                      Linked to job
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-slate-50 p-2">
        <Button variant="ghost" size="sm" className="text-xs w-full" asChild>
          <a href="/settings/integrations">Connect Email</a>
        </Button>
      </CardFooter>
    </Card>
  );
}
