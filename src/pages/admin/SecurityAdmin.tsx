import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { checkAdminAccess } from "@/utils/security";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SecurityLog {
  id: string;
  type: string;
  details: Record<string, any>;
  timestamp: string;
  ip: string;
}

interface AdminUser {
  user_id: string;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const SecurityAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");

  // Check if current user is admin
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);

        // Use the new utility function
        const { isAdmin: hasAccess, error } = await checkAdminAccess(user.id);

        if (!hasAccess) {
          console.error("Admin access check failed:", error);

          // Specific messaging for access errors
          if (
            error &&
            (error.code === "406" ||
              error.code === "404" ||
              error.code === "42P01")
          ) {
            toast({
              title: "Admin Area Setup Required",
              description:
                "The admin area may not be properly configured. Please contact support.",
              variant: "destructive",
            });
          } else {
            setIsAdmin(false);
            navigate("/"); // Redirect non-admins
            toast({
              title: "Access Denied",
              description:
                "You don't have permission to access the admin area.",
              variant: "destructive",
            });
          }
        } else {
          setIsAdmin(true);
          fetchSecurityData();
        }
      } catch (err) {
        console.error("Error:", err);
        setIsAdmin(false);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate, toast]);

  // Fetch security logs and admin users
  const fetchSecurityData = async () => {
    try {
      setIsLoading(true);

      // Fetch security logs
      const { data: logsData, error: logsError } = await supabase
        .from("security_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);

      if (logsError) throw logsError;
      setSecurityLogs(logsData || []);

      // Fetch admin users
      const { data: adminsData, error: adminsError } = await supabase
        .from("admin_users")
        .select("*");

      if (adminsError) throw adminsError;
      setAdminUsers(adminsData || []);

      // Fetch user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email");

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);
    } catch (error: any) {
      console.error("Error fetching security data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load security data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new admin user
  const addAdminUser = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find user ID from email
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newAdminEmail.trim())
        .single();

      if (userError) {
        toast({
          title: "Error",
          description: "User not found with that email",
          variant: "destructive",
        });
        return;
      }

      // Add to admin_users table
      const { error } = await supabase
        .from("admin_users")
        .insert({ user_id: userData.id });

      if (error) {
        if (error.code === "23505") {
          // Unique violation
          toast({
            title: "User already admin",
            description: "This user is already an admin",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success",
          description: "Admin user added successfully",
        });
        setNewAdminEmail("");
        fetchSecurityData();
      }
    } catch (error: any) {
      console.error("Error adding admin user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add admin user",
        variant: "destructive",
      });
    }
  };

  // Remove admin user
  const removeAdminUser = async (userId: string) => {
    try {
      // Don't allow removing yourself
      if (userId === user?.id) {
        toast({
          title: "Error",
          description: "You cannot remove yourself as admin",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("admin_users")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin privileges removed",
      });
      fetchSecurityData();
    } catch (error: any) {
      console.error("Error removing admin user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove admin user",
        variant: "destructive",
      });
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get user name from profile
  const getUserName = (userId: string) => {
    const profile = profiles.find((p) => p.id === userId);
    if (!profile) return "Unknown User";
    return `${profile.first_name} ${profile.last_name}`;
  };

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Security Administration</h1>

      <Tabs defaultValue="logs">
        <TabsList className="mb-4">
          <TabsTrigger value="logs">Security Logs</TabsTrigger>
          <TabsTrigger value="admins">Admin Users</TabsTrigger>
        </TabsList>

        {/* Security Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Security Event Logs</CardTitle>
              <CardDescription>
                View security events and potential threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading security logs...</div>
              ) : securityLogs.length === 0 ? (
                <div className="text-center py-8">No security logs found</div>
              ) : (
                <Table>
                  <TableCaption>Recent security events</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {securityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.type}
                        </TableCell>
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>{log.ip}</TableCell>
                        <TableCell>
                          <pre className="text-xs max-w-md truncate">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Users Tab */}
        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>
                Manage users with administrative access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 mb-8">
                <div className="flex-1">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium mb-2 block"
                  >
                    Add Admin User by Email
                  </label>
                  <Input
                    id="email"
                    placeholder="user@example.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                  />
                </div>
                <Button onClick={addAdminUser}>Add Admin</Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8">Loading admin users...</div>
              ) : adminUsers.length === 0 ? (
                <div className="text-center py-8">No admin users found</div>
              ) : (
                <Table>
                  <TableCaption>Current admin users</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Added On</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.map((admin) => (
                      <TableRow key={admin.user_id}>
                        <TableCell className="font-medium">
                          {getUserName(admin.user_id)}
                        </TableCell>
                        <TableCell>{formatDate(admin.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeAdminUser(admin.user_id)}
                            disabled={admin.user_id === user?.id}
                          >
                            {admin.user_id === user?.id
                              ? "Current User"
                              : "Remove"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityAdmin;
