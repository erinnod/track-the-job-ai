import { Separator } from "@/components/ui/separator";
import NotificationSettings from "@/components/NotificationSettings";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

/**
 * Notification Settings Page
 *
 * This page allows users to configure their notification preferences,
 * including email notifications, browser notifications, and daily digests.
 */
const NotificationsPage = () => {
  useDocumentTitle("Notification Settings - JobTrakr");

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl py-6">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <Link
            to="/settings"
            className="flex items-center text-blue-500 hover:text-blue-700 mb-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">
            Notification Settings
          </h1>
        </div>

        <NotificationSettings />
      </div>
    </Layout>
  );
};

export default NotificationsPage;
