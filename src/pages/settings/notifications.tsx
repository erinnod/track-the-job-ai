import React from "react";
import Layout from "@/components/layout/Layout";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const NotificationSettings = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl py-6">
        <div className="mb-6">
          <Link
            to="/settings"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Settings
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">
            Notification Settings
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your notification preferences and alert settings
          </p>
        </div>

        <div className="space-y-8">
          <NotificationsTab />
        </div>
      </div>
    </Layout>
  );
};

export default NotificationSettings;
