/**
 * AI Coming Soon Component
 *
 * This component displays a message indicating that AI features
 * are coming soon and not yet available. Used as a placeholder
 * for upcoming AI functionality.
 */

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Construction, BellRing } from "lucide-react";

interface AIComingSoonProps {
  title?: string;
  description?: string;
  featureName?: string;
  showNotifyButton?: boolean;
  className?: string;
}

const AIComingSoon = ({
  title = "AI Features Coming Soon",
  description = "We're working hard to bring you intelligent AI features to enhance your job tracking experience.",
  featureName,
  showNotifyButton = true,
  className = "",
}: AIComingSoonProps) => {
  const handleNotifyClick = () => {
    // In a real implementation, this would subscribe the user to notifications
    // For now, just show an alert
    alert(
      "Thanks for your interest! We'll notify you when AI features are available."
    );
  };

  return (
    <Card className={`border-dashed border-2 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
            {title}
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            Coming Soon
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          <Construction className="w-16 h-16 text-gray-300" />

          {featureName && (
            <div className="text-center bg-gray-50 dark:bg-gray-800 p-3 rounded-md w-full">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {featureName}
              </p>
            </div>
          )}

          {showNotifyButton && (
            <Button
              variant="outline"
              className="mt-4 flex items-center"
              onClick={handleNotifyClick}
            >
              <BellRing className="w-4 h-4 mr-2" />
              Notify me when available
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIComingSoon;
