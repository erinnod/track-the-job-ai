import { JobApplication } from "@/data/mockJobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Check,
  X,
  MessageSquare,
  Calendar,
} from "lucide-react";

interface RecentActivityProps {
  jobs: JobApplication[];
}

const RecentActivity = ({ jobs }: RecentActivityProps) => {
  // Get all activities from job applications
  const getRecentActivities = () => {
    const activities = [];

    jobs.forEach((job) => {
      // Add job application activity
      if (job.appliedDate) {
        activities.push({
          id: `app-${job.id}`,
          date: new Date(job.appliedDate),
          type: "application",
          status: job.status,
          company: job.company,
          position: job.position,
        });
      }

      // Add status change from lastUpdated if it's different from appliedDate
      if (
        job.lastUpdated &&
        (!job.appliedDate ||
          new Date(job.lastUpdated).getTime() !==
            new Date(job.appliedDate).getTime())
      ) {
        activities.push({
          id: `status-${job.id}`,
          date: new Date(job.lastUpdated),
          type: "statusChange",
          status: job.status,
          company: job.company,
          position: job.position,
        });
      }

      // Add events if they exist
      if (job.events && job.events.length > 0) {
        job.events.forEach((event, index) => {
          activities.push({
            id: `event-${job.id}-${index}`,
            date: new Date(event.date),
            type: "event",
            eventTitle: event.title,
            eventDescription: event.description,
            company: job.company,
            position: job.position,
          });
        });
      }
    });

    // Sort by date (newest first) and take first 8
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 8);
  };

  const recentActivities = getRecentActivities();

  const getActivityIcon = (activity) => {
    if (activity.type === "event") {
      const title = activity.eventTitle?.toLowerCase() || "";

      if (title.includes("offer")) {
        return (
          <Check className="h-8 w-8 p-1.5 rounded-full bg-green-100 text-green-600" />
        );
      } else if (title.includes("reject")) {
        return (
          <X className="h-8 w-8 p-1.5 rounded-full bg-red-100 text-red-600" />
        );
      } else if (
        title.includes("interview") ||
        title.includes("call") ||
        title.includes("screen")
      ) {
        return (
          <MessageSquare className="h-8 w-8 p-1.5 rounded-full bg-blue-100 text-blue-600" />
        );
      } else {
        return (
          <Calendar className="h-8 w-8 p-1.5 rounded-full bg-gray-100 text-gray-600" />
        );
      }
    } else if (activity.type === "statusChange") {
      if (activity.status === "offer") {
        return (
          <Check className="h-8 w-8 p-1.5 rounded-full bg-green-100 text-green-600" />
        );
      } else if (activity.status === "rejected") {
        return (
          <X className="h-8 w-8 p-1.5 rounded-full bg-red-100 text-red-600" />
        );
      } else if (activity.status === "interview") {
        return (
          <MessageSquare className="h-8 w-8 p-1.5 rounded-full bg-blue-100 text-blue-600" />
        );
      } else if (activity.status === "applied") {
        return (
          <ArrowUpRight className="h-8 w-8 p-1.5 rounded-full bg-purple-100 text-purple-600" />
        );
      } else {
        return (
          <Clock className="h-8 w-8 p-1.5 rounded-full bg-gray-100 text-gray-600" />
        );
      }
    } else {
      // Regular application
      return (
        <Calendar className="h-8 w-8 p-1.5 rounded-full bg-purple-100 text-purple-600" />
      );
    }
  };

  const getActivityTitle = (activity) => {
    if (activity.type === "event") {
      return `${activity.eventTitle} at ${activity.company}`;
    } else if (activity.type === "statusChange") {
      const statusText =
        {
          applied: "Applied to",
          interview: "Interview scheduled for",
          offer: "Received offer from",
          rejected: "Rejected by",
          saved: "Saved",
        }[activity.status] || "Updated";

      return `${statusText} ${activity.position} at ${activity.company}`;
    } else {
      return `Applied to ${activity.position} at ${activity.company}`;
    }
  };

  const getActivityDescription = (activity) => {
    if (activity.type === "event" && activity.eventDescription) {
      return activity.eventDescription;
    }
    return null;
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-xl">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {recentActivities.length > 0 ? (
          <div className="space-y-6">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                {getActivityIcon(activity)}
                <div className="space-y-1">
                  <p className="font-medium">{getActivityTitle(activity)}</p>
                  {getActivityDescription(activity) && (
                    <p className="text-sm text-gray-700">
                      {getActivityDescription(activity)}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(activity.date, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
