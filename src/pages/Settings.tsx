
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Shield } from "lucide-react";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { SecurityTab } from "@/components/settings/SecurityTab";

const Settings = () => {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>
          
          <TabsContent value="security">
            <SecurityTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
