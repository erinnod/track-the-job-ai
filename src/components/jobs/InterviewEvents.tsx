import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AddInterviewModal from "./AddInterviewModal";

interface InterviewEvent {
  id: string;
  job_application_id: string;
  title: string;
  description?: string;
  date: string;
  created_at: string;
}

interface InterviewEventsProps {
  jobApplicationId: string;
  company: string;
  position: string;
}

export default function InterviewEvents({
  jobApplicationId,
  company,
  position,
}: InterviewEventsProps) {
  const [events, setEvents] = useState<InterviewEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("job_application_events")
        .select("*")
        .eq("job_application_id", jobApplicationId)
        .ilike("title", "%interview%")
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching events:", error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [jobApplicationId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getDaysUntil = (dateString: string) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: "Past", variant: "secondary" as const };
    } else if (diffDays === 0) {
      return { text: "Today", variant: "destructive" as const };
    } else if (diffDays === 1) {
      return { text: "Tomorrow", variant: "default" as const };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days`, variant: "default" as const };
    } else {
      return { text: `${diffDays} days`, variant: "outline" as const };
    }
  };

  const handleInterviewAdded = () => {
    fetchEvents();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Interview Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Loading events...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Interview Events
          </CardTitle>
          <AddInterviewModal
            jobApplicationId={jobApplicationId}
            company={company}
            position={position}
            onInterviewAdded={handleInterviewAdded}
          />
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No interview events scheduled</p>
            <p className="text-sm">Add an interview to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const daysUntil = getDaysUntil(event.date);
              return (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {event.title}
                      </h4>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTime(event.date)}
                        </div>
                      </div>
                    </div>
                    <Badge variant={daysUntil.variant}>
                      {daysUntil.text}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
