
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
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
      location: ""
    }
  });

  // Fetch user data on mount
  useEffect(() => {
    const fetchProfessionalData = async () => {
      try {
        setIsInitializing(true);
        
        // Get current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        const userId = userData.user?.id;
        
        if (!userId) {
          throw new Error("User not authenticated");
        }
        
        // Get professional data
        const { data, error } = await supabase
          .from('professional_details')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          // PGRST116 is the error code for "No rows returned" - we handle this by using defaults
          throw error;
        }
        
        if (data) {
          professionalForm.reset({
            title: data.title || "",
            company: data.company || "",
            industry: data.industry || "",
            location: data.location || ""
          });
        }
        
      } catch (error: any) {
        console.error("Error fetching professional data:", error);
        // If we can't load, still allow entering new info
        professionalForm.reset({
          title: "Senior Developer",
          company: "Tech Solutions Inc.",
          industry: "Information Technology",
          location: "San Francisco, CA"
        });
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
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      // Save to Supabase - assumes you have a "professional_details" table
      const { error } = await supabase
        .from('professional_details')
        .upsert({
          user_id: userId,
          title: data.title,
          company: data.company,
          industry: data.industry,
          location: data.location,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: "Professional details updated",
        description: "Your professional details have been saved successfully.",
      });
    } catch (error: any) {
      console.error("Error saving professional data:", error);
      toast({
        title: "Error saving information",
        description: error.message || "There was a problem saving your changes.",
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
        <CardDescription>Update your job preferences and professional information.</CardDescription>
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
                    <Input {...field} />
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
                    <Input {...field} />
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
                    <Input {...field} />
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
                    <Input {...field} />
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
