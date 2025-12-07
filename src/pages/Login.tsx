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
  validateCSRFToken,
  throttle,
} from "@/utils/security";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
const THROTTLE_TIME = 1000; // 1 second throttle for submit

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

  // Security enhancement: Login attempt tracking
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>("");

  // Flag to ensure the toast is only shown once
  const verificationToastShown = useRef(false);

  // Load stored login attempt data
  useEffect(() => {
    try {
      const storedAttempts = sessionStorage.getItem("login_attempts");
      const storedLockout = sessionStorage.getItem("login_lockout");

      if (storedAttempts) {
        setLoginAttempts(parseInt(storedAttempts, 10));
      }

      if (storedLockout) {
        const lockoutTime = parseInt(storedLockout, 10);
        if (lockoutTime > Date.now()) {
          setLockoutUntil(lockoutTime);
        } else {
          // Clear expired lockout
          sessionStorage.removeItem("login_lockout");
          setLockoutUntil(null);
        }
      }
    } catch (error) {
      console.error("Error loading login security data:", error);
    }
  }, []);

  // CSRF token generation - regenerate on component mount
  useEffect(() => {
    const token = generateCSRFToken();
    storeCSRFToken(token);
    setCsrfToken(token);
  }, []);

  // Handle search parameters
  useEffect(() => {
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

    // Try to pre-fill email from URL parameter (if from verification)
    const emailParam = searchParams.get("email");
    if (emailParam) {
      // Validate and sanitize the email
      const sanitizedEmail = sanitizeInput(emailParam);
      if (isValidEmail(sanitizedEmail)) {
        setFormData((prev) => ({ ...prev, email: sanitizedEmail }));
      }
    }
  }, [searchParams, toast]);

  // Check if account is locked
  const isAccountLocked = () => {
    if (!lockoutUntil) return false;
    return Date.now() < lockoutUntil;
  };

  // Format remaining lockout time
  const formatLockoutTime = () => {
    if (!lockoutUntil) return "";

    const remainingMs = lockoutUntil - Date.now();
    if (remainingMs <= 0) return "";

    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);

    return `${minutes}m ${seconds}s`;
  };

  // Handle input changes with validation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Clear error when user starts typing
    setErrorMessage(null);

    // Basic validation and sanitization
    if (name === "email") {
      setFormData((prev) => ({ ...prev, [name]: value.trim() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Throttled submit handler to prevent brute force attacks
  const throttledSubmit = throttle(async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous error
    setErrorMessage(null);

    // Check if account is locked
    if (isAccountLocked()) {
      setErrorMessage(
        `Too many failed attempts. Please try again in ${formatLockoutTime()}`
      );
      return;
    }

    // Validate CSRF token
    if (!validateCSRFToken(csrfToken)) {
      setErrorMessage(
        "Security validation failed. Please reload the page and try again."
      );
      return;
    }

    // Validate inputs
    if (!formData.email || !formData.password) {
      setErrorMessage("Email and password are required");
      return;
    }

    // Check email validity
    if (!isValidEmail(formData.email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    // Additional password validation
    if (formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      return;
    }

    try {
      setIsLoading(true);

      // Attempt to sign in
      const result = await signIn({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        // Login successful
        await refreshUser();

        // Reset login attempts on successful login
        setLoginAttempts(0);
        sessionStorage.removeItem("login_attempts");
        sessionStorage.removeItem("login_lockout");

        // Regenerate CSRF token after successful login
        const newToken = generateCSRFToken();
        storeCSRFToken(newToken);

        // Navigate to dashboard
        toast({
          title: "Login Successful",
          description: "Welcome back to JobTrakr!",
        });

        navigate("/dashboard");
      } else {
        // Login failed
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        sessionStorage.setItem("login_attempts", newAttempts.toString());

        // Check if we need to lock the account
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const lockoutTime = Date.now() + LOGIN_LOCKOUT_TIME;
          setLockoutUntil(lockoutTime);
          sessionStorage.setItem("login_lockout", lockoutTime.toString());
          setErrorMessage(
            `Too many failed attempts. Your account is locked for ${formatLockoutTime()}`
          );
        } else {
          // Set error with remaining attempts info
          setErrorMessage(
            `Invalid email or password. ${
              MAX_LOGIN_ATTEMPTS - newAttempts
            } attempts remaining.`
          );
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, THROTTLE_TIME);

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={throttledSubmit} className="space-y-4">
            {/* Security token - hidden from user */}
            <input type="hidden" name="csrf_token" value={csrfToken} />

            {/* Display error message if present */}
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Lock notification */}
            {isAccountLocked() && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Account Temporarily Locked</AlertTitle>
                <AlertDescription>
                  Too many failed login attempts. Please try again in{" "}
                  {formatLockoutTime()}.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading || isAccountLocked()}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading || isAccountLocked()}
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={
                isLoading ||
                isAccountLocked() ||
                !formData.email ||
                !formData.password
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
};

export default Login;
