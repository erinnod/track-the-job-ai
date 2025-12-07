import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "@/services/notificationService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    const userId = searchParams.get("userId");

    const verify = async () => {
      if (!token || !userId) {
        setVerificationStatus("error");
        setErrorMessage(
          "Invalid verification link. Please request a new verification email."
        );
        return;
      }

      try {
        const success = await verifyEmail(token, userId);
        if (success) {
          setVerificationStatus("success");
        } else {
          setVerificationStatus("error");
          setErrorMessage(
            "Email verification failed. The link may have expired. Please request a new verification email."
          );
        }
      } catch (error) {
        console.error("Error verifying email:", error);
        setVerificationStatus("error");
        setErrorMessage(
          "An error occurred during verification. Please try again later."
        );
      }
    };

    verify();
  }, [searchParams]);

  const handleContinue = () => {
    navigate("/dashboard");
  };

  const handleRequestNewVerification = () => {
    navigate("/settings/notifications"); // Redirect to notification settings page to request a new verification
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Email Verification
          </CardTitle>
          <CardDescription>
            {verificationStatus === "loading" &&
              "Verifying your email address..."}
            {verificationStatus === "success" &&
              "Your email has been verified!"}
            {verificationStatus === "error" && "Verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center p-6">
          {verificationStatus === "loading" && (
            <div className="animate-spin h-12 w-12 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
          )}

          {verificationStatus === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-center mb-4">
                Thank you for verifying your email address. You will now receive
                email notifications based on your preferences.
              </p>
            </>
          )}

          {verificationStatus === "error" && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-center mb-4 text-red-600">{errorMessage}</p>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {verificationStatus === "success" && (
            <Button onClick={handleContinue}>Continue to Dashboard</Button>
          )}
          {verificationStatus === "error" && (
            <Button onClick={handleRequestNewVerification}>
              Request New Verification
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmailVerification;
