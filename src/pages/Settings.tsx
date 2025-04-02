
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Shield, Mail, Smartphone } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

const Settings = () => {
  const { toast } = useToast();
  
  // Profile form state
  const personalForm = useForm({
    defaultValues: {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567"
    }
  });

  const professionalForm = useForm({
    defaultValues: {
      title: "Senior Developer",
      company: "Tech Solutions Inc.",
      industry: "Information Technology",
      location: "San Francisco, CA"
    }
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    email: false,
    sms: true,
    jobMatches: true,
    applicationStatus: true,
    interviewReminders: true,
    marketing: false
  });

  // Security form state
  const securityForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Handle saving personal info
  const onPersonalSubmit = (data) => {
    console.log("Saving personal data:", data);
    toast({
      title: "Personal information updated",
      description: "Your personal information has been saved successfully.",
    });
  };

  // Handle saving professional info
  const onProfessionalSubmit = (data) => {
    console.log("Saving professional data:", data);
    toast({
      title: "Professional details updated",
      description: "Your professional details have been saved successfully.",
    });
  };

  // Handle saving notification preferences
  const saveNotifications = () => {
    console.log("Saving notification preferences:", notifications);
    toast({
      title: "Notification preferences updated",
      description: "Your notification preferences have been saved successfully.",
    });
  };

  // Handle changing notification settings
  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle saving security settings
  const onSecuritySubmit = (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "New password and confirmation do not match.",
        variant: "destructive"
      });
      return;
    }
    console.log("Saving security settings:", data);
    securityForm.reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    toast({
      title: "Password updated",
      description: "Your password has been updated successfully.",
    });
  };

  // Handle two-factor authentication toggle
  const handleTwoFactorToggle = (enabled) => {
    setTwoFactorEnabled(enabled);
    toast({
      title: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`,
      description: `Two-factor authentication has been ${enabled ? 'enabled' : 'disabled'} for your account.`,
    });
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <Form {...personalForm}>
                  <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)}>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col items-center space-y-3 mb-6">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src="" />
                          <AvatarFallback className="text-xl">JD</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" size="sm">Change Profile Picture</Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={personalForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={personalForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={personalForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={personalForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input {...field} type="tel" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button type="submit">Save Changes</Button>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Professional Details</CardTitle>
                  <CardDescription>Update your job preferences and professional information.</CardDescription>
                </CardHeader>
                <Form {...professionalForm}>
                  <form onSubmit={professionalForm.handleSubmit(onProfessionalSubmit)}>
                    <CardContent className="space-y-4">
                      <FormField
                        control={professionalForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={professionalForm.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Company</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={professionalForm.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={professionalForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Location</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button type="submit">Save Changes</Button>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications">
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
                <Button onClick={saveNotifications}>Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your password and security preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Form {...securityForm}>
                  <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                    <h3 className="font-medium">Change Password</h3>
                    
                    <FormField
                      control={securityForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securityForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securityForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="mt-2">Update Password</Button>
                  </form>
                </Form>
                
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p>Enhance your account security</p>
                      <p className="text-sm text-muted-foreground">We'll ask for a verification code in addition to your password.</p>
                    </div>
                    <Switch 
                      checked={twoFactorEnabled} 
                      onCheckedChange={handleTwoFactorToggle} 
                    />
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => {
                      if (!twoFactorEnabled) {
                        handleTwoFactorToggle(true);
                      } else {
                        toast({
                          title: "Two-factor authentication",
                          description: "Settings page opened.",
                        });
                      }
                    }}
                  >
                    {twoFactorEnabled ? "Manage two-factor authentication" : "Set up two-factor authentication"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
