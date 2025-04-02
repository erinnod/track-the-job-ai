
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mail, Smartphone } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const NotificationsTab = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState({
    email: false,
    sms: true,
    jobMatches: true,
    applicationStatus: true,
    interviewReminders: true,
    marketing: false
  });

  // Handle saving notification preferences
  const saveNotifications = async () => {
    try {
      setIsLoading(true);
      console.log("Saving notification preferences:", notifications);
      
      // Save to Supabase - assumes you have a "notification_preferences" table
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          email_enabled: notifications.email,
          sms_enabled: notifications.sms,
          job_matches: notifications.jobMatches,
          application_status: notifications.applicationStatus,
          interview_reminders: notifications.interviewReminders,
          marketing: notifications.marketing,
          updated_at: new Date()
        });
      
      if (error) throw error;
      
      toast({
        title: "Notification preferences updated",
        description: "Your notification preferences have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      toast({
        title: "Error saving preferences",
        description: "There was a problem saving your notification preferences.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle changing notification settings
  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how and when you receive notifications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Email Notifications</h3>
            </div>
            <p className="text-sm text-muted-foreground">Receive updates via email</p>
          </div>
          <Switch 
            checked={notifications.email} 
            onCheckedChange={(checked) => handleNotificationChange("email", checked)} 
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">SMS Notifications</h3>
            </div>
            <p className="text-sm text-muted-foreground">Receive updates via text message</p>
          </div>
          <Switch 
            checked={notifications.sms} 
            onCheckedChange={(checked) => handleNotificationChange("sms", checked)} 
          />
        </div>
        
        <div className="space-y-3">
          <h3 className="font-medium">Notify me about:</h3>
          
          <div className="flex items-center justify-between">
            <p className="text-sm">New job matches</p>
            <Switch 
              checked={notifications.jobMatches} 
              onCheckedChange={(checked) => handleNotificationChange("jobMatches", checked)} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm">Application status changes</p>
            <Switch 
              checked={notifications.applicationStatus} 
              onCheckedChange={(checked) => handleNotificationChange("applicationStatus", checked)} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm">Interview reminders</p>
            <Switch 
              checked={notifications.interviewReminders} 
              onCheckedChange={(checked) => handleNotificationChange("interviewReminders", checked)} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm">Marketing communications</p>
            <Switch 
              checked={notifications.marketing} 
              onCheckedChange={(checked) => handleNotificationChange("marketing", checked)} 
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={saveNotifications} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
};
