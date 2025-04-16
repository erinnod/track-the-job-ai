import React from "react";
import Layout from "@/components/layout/Layout";
import { SecurityTab } from "@/components/settings/SecurityTab";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const SecuritySettings = () => {
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
            Security Settings
          </h1>
          <p className="text-slate-500 mt-1">
            Update your password, set up two-factor authentication, and manage
            devices
          </p>
        </div>

        <div className="space-y-8">
          <SecurityTab />
        </div>
      </div>
    </Layout>
  );
};

export default SecuritySettings;
