
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { PersonalFormValues } from "@/components/settings/profile/PersonalInfoForm";

export const useProfileForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Profile form state
  const form = useForm<PersonalFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: ""
    }
  });

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsInitializing(true);
        
        // Get current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
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
        
        console.log("Fetching profile for user ID:", userId);
        
        // Get profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.error("Error fetching profile:", error);
          
          // If it's just "No rows returned", we'll create a profile later
          if (error.code !== 'PGRST116') {
            toast({
              title: "Error loading profile",
              description: "Could not load your profile information. " + error.message,
              variant: "destructive",
            });
          } else {
            console.log("No profile found, will create one on first save");
            // Initialize with authenticated email
            form.setValue("email", userData.user.email || "");
          }
        } else if (data) {
          console.log("Profile data loaded:", data);
          form.reset({
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            email: data.email || userData.user.email || "",
            phone: data.phone || "",
          });
        }
        
      } catch (error: any) {
        console.error("Exception fetching user data:", error);
        toast({
          title: "Error loading profile",
          description: error.message || "Could not load your profile information.",
          variant: "destructive",
        });
      } finally {
        setIsInitializing(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Handle saving personal info
  const onSubmit = async (data: PersonalFormValues) => {
    try {
      setIsLoading(true);
      console.log("Saving personal data:", data);
      
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error("Authentication error: " + userError.message);
      }
      
      const userId = userData.user?.id;
      
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      console.log("Saving profile for user ID:", userId);
      
      // Save to Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error("Error saving profile:", error);
        throw error;
      }
      
      console.log("Profile saved successfully");
      
      toast({
        title: "Personal information updated",
        description: "Your personal information has been saved successfully.",
      });
    } catch (error: any) {
      console.error("Exception saving personal data:", error);
      toast({
        title: "Error saving information",
        description: error.message || "There was a problem saving your changes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    const firstName = form.getValues("firstName");
    const lastName = form.getValues("lastName");
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else {
      return "U";
    }
  };

  return {
    form,
    isLoading,
    isInitializing,
    onSubmit,
    getInitials
  };
};
