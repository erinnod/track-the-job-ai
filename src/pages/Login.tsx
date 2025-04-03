import { useState, useEffect } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { signIn } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import {
  sanitizeInput,
  isValidEmail,
  generateCSRFToken,
  storeCSRFToken,
} from "@/utils/security";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Generate CSRF token on component mount
  useEffect(() => {
    const csrfToken = generateCSRFToken();
    storeCSRFToken(csrfToken);

    // Check if user came from signup with pending verification
    const pendingVerification = searchParams.get("pendingVerification");
    if (pendingVerification === "true") {
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
        navigate("/");
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
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </CardFooter>
        </form>
        <div className="px-8 py-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:text-blue-800">
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
