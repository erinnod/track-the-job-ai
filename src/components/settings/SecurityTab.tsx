
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

export const SecurityTab = () => {
  const { toast } = useToast();
  
  // Security form state
  const securityForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

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
  );
};
