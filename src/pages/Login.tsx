import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { useResponsiveToast } from "@/hooks/use-responsive-toast";
import { signIn } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import {
  sanitizeInput,
  isValidEmail,
  generateCSRFToken,
  storeCSRFToken,
} from "@/utils/security";
import { AuthLayout } from "@/components/auth/AuthLayout";

const Login = () => {
  const { toast } = useResponsiveToast();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Flag to ensure the toast is only shown once
  const verificationToastShown = useRef(false);

  // Generate CSRF token on component mount
  useEffect(() => {
    const csrfToken = generateCSRFToken();
    storeCSRFToken(csrfToken);

    // Check if user came from signup with pending verification
    const pendingVerification = searchParams.get("pendingVerification");
    if (pendingVerification === "true" && !verificationToastShown.current) {
      verificationToastShown.current = true;
      toast({
        title: "Verification Email Sent",
        description:
          "Please check your email and click the verification link before logging in.",
      });
    }
  }, [searchParams, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Sanitize the email input
    const sanitizedEmail = sanitizeInput(formData.email.trim());
    const password = formData.password;

    // Validate inputs
    if (!sanitizedEmail || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!isValidEmail(sanitizedEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Small delay to prevent brute force
    await new Promise((r) => setTimeout(r, 300));

    try {
      const result = await signIn(sanitizedEmail, password);

      if (!result.success) {
        // Dispatch a custom login failure event for security monitoring
        window.dispatchEvent(
          new CustomEvent("login-failure", {
            detail: {
              email: sanitizedEmail,
              timestamp: new Date().toISOString(),
              ip: "client-side", // In a real app, you'd get this from the server
            },
          })
        );

        toast({
          title: "Login Failed",
          description: result.error,
          variant: "destructive",
        });
        setIsLoading(false);
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        await refreshUser();
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);

      // Dispatch a custom login failure event for security monitoring
      window.dispatchEvent(
        new CustomEvent("login-failure", {
          detail: {
            email: sanitizedEmail,
            timestamp: new Date().toISOString(),
            ip: "client-side",
          },
        })
      );

      toast({
        title: "An error occurred",
        description: "Please try again later",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-md shadow-xl border border-white/20 rounded-xl overflow-hidden">
        <CardHeader className="space-y-1 text-center pb-4">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your JobTrakr account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                placeholder="john.doe@example.com"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
                autoComplete="email"
                className="bg-white/50 border-white/30 focus:border-primary focus:ring-primary shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
                autoComplete="current-password"
                className="bg-white/50 border-white/30 focus:border-primary focus:ring-primary shadow-sm"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </CardFooter>
        </form>
        <div className="px-8 py-4 text-center border-t border-white/20">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
};

export default Login;
