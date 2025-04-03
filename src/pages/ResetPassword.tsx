import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { updatePassword } from "@/lib/auth";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const PASSWORD_MIN_LENGTH = 8;

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isValidSession, setIsValidSession] = useState(false);
  const [sessionCheckComplete, setSessionCheckComplete] = useState(false);

  // Check if the user is authenticated via a password reset token
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        // If user has a valid session from a password reset link
        if (data.session) {
          setIsValidSession(true);
        } else {
          setIsValidSession(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setIsValidSession(false);
      } finally {
        setSessionCheckComplete(true);
      }
    };

    checkSession();
  }, []);

  const validatePassword = (): boolean => {
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

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    if (!validatePassword()) {
      return;
    }

    try {
      setIsLoading(true);

      // First check if this is the same as the current password
      const { error: checkError } = await supabase.auth.signInWithPassword({
        email: "", // We don't know the email, but Supabase will match with current session
        password: password,
      });

      // If sign in succeeds, it means this is the current password
      if (!checkError) {
        setErrors(["New password cannot be the same as your current password"]);
        return;
      }

      // Update the password
      const result = await updatePassword(password);

      if (!result.success) {
        throw new Error(result.error);
      }

      setIsCompleted(true);
      toast({
        title: "Password reset successful",
        description: "Your password has been updated successfully",
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking session
  if (!sessionCheckComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <div className="text-center">
          <p>Checking your reset link...</p>
        </div>
      </div>
    );
  }

  // If the session is invalid (no valid reset token)
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">
              Invalid Reset Link
            </CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Please request a new password reset link from the login page.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => navigate("/forgot-password")}
            >
              Request New Reset Link
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="mb-12">
        <img
          src="/images/jobtrakr-logo.png"
          alt="JobTrakr Logo"
          className="h-16 w-auto"
          style={{ maxWidth: "320px" }}
        />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            Reset Your Password
          </CardTitle>
          <CardDescription>
            {isCompleted
              ? "Your password has been reset successfully"
              : "Enter your new password below"}
          </CardDescription>
        </CardHeader>
        {!isCompleted ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errors.length > 0 && (
                <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                  <div className="font-medium mb-1">
                    Please correct the following errors:
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="text-sm text-gray-500">
                <p>Password must:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Be at least {PASSWORD_MIN_LENGTH} characters long</li>
                  <li>Include at least one uppercase letter</li>
                  <li>Include at least one lowercase letter</li>
                  <li>Include at least one number</li>
                  <li>Include at least one special character</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-md text-green-800 text-center">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2" />
              <p className="mb-2 font-medium">Password Reset Successful!</p>
              <p className="text-sm">
                Your password has been reset successfully. You will be
                redirected to the login page shortly.
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
