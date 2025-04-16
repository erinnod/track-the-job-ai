import React from "react";
import Layout from "@/components/layout/Layout";
import { ProfileForm } from "@/components/settings/profile/ProfileForm";
import { ProfessionalForm } from "@/components/settings/profile/ProfessionalForm";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Static rendering with error boundary pattern
const ProfileSettings = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl py-6">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <Link
            to="/settings"
            className="flex items-center text-blue-500 hover:text-blue-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">
            Profile Settings
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ProfileForm />
          <ProfessionalForm />
        </div>
      </div>
    </Layout>
  );
};

export default ProfileSettings;
