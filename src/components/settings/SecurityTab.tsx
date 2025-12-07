import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updatePassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logger } from "@/utils/logger";

const PASSWORD_MIN_LENGTH = 8;

interface SecurityFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const SecurityTab = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Security form state
  const securityForm = useForm<SecurityFormValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Validate password strength
  const validatePassword = (
    password: string,
    confirmPassword: string
  ): string[] => {
    const validationErrors: string[] = [];

    if (password.length < PASSWORD_MIN_LENGTH) {
      validationErrors.push(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`
      );
    }

    if (!/[A-Z]/.test(password)) {
      validationErrors.push(
        "Password must contain at least one uppercase letter"
      );
    }

    if (!/[a-z]/.test(password)) {
      validationErrors.push(
        "Password must contain at least one lowercase letter"
      );
    }

    if (!/[0-9]/.test(password)) {
      validationErrors.push("Password must contain at least one number");
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      validationErrors.push(
        "Password must contain at least one special character"
      );
    }

    if (password !== confirmPassword) {
      validationErrors.push("Passwords do not match");
    }

    return validationErrors;
  };

  // Handle saving security settings
  const onSecuritySubmit = async (data: SecurityFormValues) => {
    // Clear previous errors
    setErrors([]);

    // First, verify the current password
    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user?.email) {
        throw new Error("Could not verify your account. Please sign in again.");
      }

      // Check if current password is correct
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: data.currentPassword,
      });

      if (signInError) {
        setErrors(["Current password is incorrect"]);
        return;
      }

      // Validate the new password
      const validationErrors = validatePassword(
        data.newPassword,
        data.confirmPassword
      );
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      setIsLoading(true);

      // Use our enhanced updatePassword function
      const result = await updatePassword(data.newPassword);

      if (!result.success) {
        throw new Error(result.error);
      }

      securityForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
    } catch (error: any) {
      logger.error("Error updating password:", error);
      toast({
        title: "Error updating password",
        description:
          error.message || "There was a problem updating your password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>
          Manage your password and security preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...securityForm}>
          <form
            onSubmit={securityForm.handleSubmit(onSecuritySubmit)}
            className="space-y-4"
          >
            <h3 className="font-medium">Change Password</h3>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="mt-2">
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

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
                  <FormMessage />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-sm text-muted-foreground mt-2">
              <p>Password must:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Be at least {PASSWORD_MIN_LENGTH} characters long</li>
                <li>Include at least one uppercase letter</li>
                <li>Include at least one lowercase letter</li>
                <li>Include at least one number</li>
                <li>Include at least one special character</li>
              </ul>
            </div>

            <Button type="submit" className="mt-4" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
