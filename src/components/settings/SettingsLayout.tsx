import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { User, Bell, Lock, LinkIcon, CreditCard } from "lucide-react";

interface SettingsLayoutProps {
  children: ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      title: "Profile",
      path: "/settings/profile",
      icon: <User className="h-4 w-4 mr-2" />,
    },
    {
      title: "Security",
      path: "/settings/security",
      icon: <Lock className="h-4 w-4 mr-2" />,
    },
    {
      title: "Integrations",
      path: "/settings/integrations",
      icon: <LinkIcon className="h-4 w-4 mr-2" />,
    },
    {
      title: "Notifications",
      path: "/settings/notifications",
      icon: <Bell className="h-4 w-4 mr-2" />,
    },
    {
      title: "Billing",
      path: "/settings/billing",
      icon: <CreditCard className="h-4 w-4 mr-2" />,
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Settings navigation sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={currentPath === item.path ? "default" : "ghost"}
                  asChild
                  className="w-full justify-start"
                >
                  <Link to={item.path}>
                    {item.icon}
                    {item.title}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 border rounded-lg p-6">{children}</div>
        </div>
      </div>
    </Layout>
  );
}
