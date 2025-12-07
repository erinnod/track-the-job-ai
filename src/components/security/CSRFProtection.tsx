import { useEffect, useState } from "react";
import {
  generateCSRFToken,
  storeCSRFToken,
  validateCSRFToken,
} from "@/utils/security";

interface CSRFTokenProps {
  /**
   * Callback function that will receive the generated token
   */
  onTokenGenerated?: (token: string) => void;
}

/**
 * Hidden CSRF token component for form protection
 * Use this inside forms to protect against Cross-Site Request Forgery attacks
 */
export const CSRFToken: React.FC<CSRFTokenProps> = ({ onTokenGenerated }) => {
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    // Generate a new token when component mounts
    const csrfToken = generateCSRFToken();
    setToken(csrfToken);
    storeCSRFToken(csrfToken);

    // Call the callback if provided
    if (onTokenGenerated) {
      onTokenGenerated(csrfToken);
    }
  }, [onTokenGenerated]);

  return <input type="hidden" name="csrf_token" value={token} />;
};

interface CSRFFormProps {
  /**
   * Children elements (form contents)
   */
  children: React.ReactNode;

  /**
   * Form submission handler
   */
  onSubmit: (e: React.FormEvent) => void;

  /**
   * Additional form props
   */
  [key: string]: any;
}

/**
 * Form component with built-in CSRF protection
 * Automatically validates the CSRF token on submission
 */
export const CSRFProtectedForm: React.FC<CSRFFormProps> = ({
  children,
  onSubmit,
  ...props
}) => {
  const [csrfToken, setCsrfToken] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the CSRF token before proceeding
    if (!validateCSRFToken(csrfToken)) {
      console.error("CSRF token validation failed");

      // You could show an error message here
      return;
    }

    // If token is valid, call the original submit handler
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} {...props}>
      {children}
      <CSRFToken onTokenGenerated={setCsrfToken} />
    </form>
  );
};

/**
 * Hook to use CSRF protection in custom forms
 * @returns Object with token and validation function
 */
export const useCSRF = () => {
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const csrfToken = generateCSRFToken();
    setToken(csrfToken);
    storeCSRFToken(csrfToken);
  }, []);

  const validate = (tokenToValidate: string): boolean => {
    return validateCSRFToken(tokenToValidate);
  };

  return {
    token,
    validate,
    csrfField: <input type="hidden" name="csrf_token" value={token} />,
  };
};
