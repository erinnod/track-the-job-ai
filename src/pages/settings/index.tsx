import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings,
  User,
  Bell,
  Shield,
  Briefcase,
  ArrowRight,
} from "lucide-react";

const SettingsIndex = () => {
  return (
    <Layout>
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
          <p className="text-slate-500 mt-1">
            Manage your account and application preferences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <Link to="/settings/profile">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-3">
                <User className="h-6 w-6 text-blue-500" />
                <CardTitle className="text-lg">Profile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500">
                  Update your profile information, resume, and contact details
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Notification Settings */}
          <Link to="/settings/notifications">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-3">
                <Bell className="h-6 w-6 text-blue-500" />
                <CardTitle className="text-lg">Notification Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500">
                  Manage your notification preferences and alert settings
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Security Settings */}
          <Link to="/settings/security">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-3">
                <Shield className="h-6 w-6 text-blue-500" />
                <CardTitle className="text-lg">Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500">
                  Update your password, set up two-factor authentication, and
                  manage devices
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Integrations */}
          <Link to="/settings/integrations">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-blue-100 bg-blue-50">
              <CardHeader className="flex flex-row items-center gap-3">
                <Briefcase className="h-6 w-6 text-blue-500" />
                <CardTitle className="text-lg">Integrations</CardTitle>
                <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full ml-auto">
                  New
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Connect your Indeed and LinkedIn accounts to import job
                  applications automatically
                </p>
                <div className="mt-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    Connect Accounts
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsIndex;
