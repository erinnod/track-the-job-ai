import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { logger } from "@/utils/logger";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-jobtrakr-lightgray">
      <div className="text-center max-w-md px-4">
        <h1 className="text-6xl font-bold text-jobtrakr-blue mb-4">404</h1>
        <p className="text-xl text-jobtrakr-charcoal mb-6">
          Oops! We couldn't find the page you're looking for.
        </p>
        <p className="text-jobtrakr-mediumgray mb-8">
          The page might have been moved, deleted, or perhaps never existed.
        </p>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
