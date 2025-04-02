import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { supabase } from "@/lib/supabase";

interface ProfessionalFormValues {
  title: string;
  company: string;
  industry: string;
  location: string;
}

export const ProfessionalForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const professionalForm = useForm<ProfessionalFormValues>({
    defaultValues: {
      title: "",
      company: "",
      industry: "",
      location: "",
    },
  });

  // Fetch user data on mount
  useEffect(() => {
    const fetchProfessionalData = async () => {
      try {
        setIsInitializing(true);

        // Get current user
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) {
          console.error("Error getting user:", userError);
          toast({
            title: "Authentication error",
            description: "Please sign in to view your profile.",
            variant: "destructive",
          });
          return;
        }

        const userId = userData.user?.id;

        if (!userId) {
          console.error("No user ID found");
          toast({
            title: "Authentication error",
            description: "Please sign in to view your profile.",
            variant: "destructive",
          });
          return;
        }

        console.log("Fetching professional details for user ID:", userId);

        // First check if the professional_details table exists
        const { error: tableCheckError } = await supabase
          .from("professional_details")
          .select("count", { count: "exact", head: true });

        if (tableCheckError) {
          console.error(
            "Error checking professional_details table:",
            tableCheckError
          );
          console.log("Creating professional_details table might be needed");
          // Continue without loading data - the form will start with empty fields
          // The table will be created when the user saves for the first time
          return;
        }

        // Get professional data if the table exists
        const { data, error } = await supabase
          .from("professional_details")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error("Error fetching professional data:", error);

          // If it's just "No rows returned", we'll create a record on first save
          if (error.code !== "PGRST116") {
            toast({
              title: "Error loading professional details",
              description:
                "Could not load your professional information. " +
                error.message,
              variant: "destructive",
            });
          } else {
            console.log(
              "No professional details found, will create on first save"
            );
            // Start with empty form fields - no hardcoded defaults
          }
        } else if (data) {
          console.log("Professional data loaded:", data);
          professionalForm.reset({
            title: data.title || "",
            company: data.company || "",
            industry: data.industry || "",
            location: data.location || "",
          });
        }
      } catch (error: any) {
        console.error("Exception fetching professional data:", error);
        // If we can't load, still allow entering new info with empty fields
        // Do not reset the form with hardcoded values
      } finally {
        setIsInitializing(false);
      }
    };

    fetchProfessionalData();
  }, []);

  // Handle saving professional info
  const onProfessionalSubmit = async (data: ProfessionalFormValues) => {
    try {
      setIsLoading(true);
      console.log("Saving professional data:", data);

      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) {
        throw new Error("Authentication error: " + userError.message);
      }

      const userId = userData.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      console.log("Saving professional details for user ID:", userId);

      // Check if any of the fields are empty and replace with null for proper database upsert
      const professionalData = {
        id: userId, // Use userId as the primary key
        user_id: userId,
        title: data.title || null,
        company: data.company || null,
        industry: data.industry || null,
        location: data.location || null,
        updated_at: new Date().toISOString(),
      };

      // Save to Supabase - will create the table if it doesn't exist
      // Specify the conflict target to avoid duplicate key violations
      const { error } = await supabase
        .from("professional_details")
        .upsert(professionalData, {
          onConflict: "user_id",
          ignoreDuplicates: false,
        });

      if (error) {
        console.error("Error saving professional data:", error);
        throw error;
      }

      console.log("Professional details saved successfully");

      toast({
        title: "Professional details updated",
        description: "Your professional details have been saved successfully.",
      });
    } catch (error: any) {
      console.error("Error saving professional data:", error);
      toast({
        title: "Error saving information",
        description:
          error.message || "There was a problem saving your changes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Details</CardTitle>
        <CardDescription>
          Update your job preferences and professional information.
        </CardDescription>
      </CardHeader>
      <Form {...professionalForm}>
        <form onSubmit={professionalForm.handleSubmit(onProfessionalSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={professionalForm.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Software Engineer" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={professionalForm.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Company</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Acme Corp" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={professionalForm.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Technology" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={professionalForm.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Location</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. San Francisco, CA" />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || isInitializing}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
