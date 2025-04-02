import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { PersonalFormValues } from "@/components/settings/profile/PersonalInfoForm";
import { useAvatar } from "@/contexts/AvatarContext";

export const useProfileForm = () => {
  const { toast } = useToast();
  const { triggerAvatarUpdate } = useAvatar();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Profile form state
  const form = useForm<PersonalFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
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

        console.log("Fetching profile for user ID:", userId);

        // Get profile data
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);

          // If it's just "No rows returned", we'll create a profile later and use user metadata
          if (error.code !== "PGRST116") {
            toast({
              title: "Error loading profile",
              description:
                "Could not load your profile information. " + error.message,
              variant: "destructive",
            });
          } else {
            console.log("No profile found, will create one on first save");
            console.log("User metadata:", userData.user.user_metadata);

            // Initialize with authenticated email and info from signup
            const userMeta = userData.user.user_metadata;
            form.reset({
              firstName: userMeta?.first_name || "",
              lastName: userMeta?.last_name || "",
              email: userData.user.email || "",
              phone: "",
            });
          }
        } else if (data) {
          console.log("Profile data loaded:", data);
          form.reset({
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            email: data.email || userData.user.email || "",
            phone: data.phone || "",
          });

          // If avatar is set, get the public URL
          if (data.avatar_url) {
            await fetchAvatarUrl(data.avatar_url);
          }
        }
      } catch (error: any) {
        console.error("Exception fetching user data:", error);
        toast({
          title: "Error loading profile",
          description:
            error.message || "Could not load your profile information.",
          variant: "destructive",
        });
      } finally {
        setIsInitializing(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch avatar URL from storage
  const fetchAvatarUrl = async (path: string) => {
    try {
      const { data } = await supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      if (data?.publicUrl) {
        setAvatarUrl(data.publicUrl);
      }
    } catch (error) {
      console.error("Exception getting avatar URL:", error);
    }
  };

  // Upload avatar
  const uploadAvatar = async (file: File) => {
    try {
      setIsUploadingAvatar(true);

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

      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Try to upload directly - this assumes the bucket already exists
      // and has been set up with proper permissions in the Supabase dashboard
      console.log("Attempting to upload file to avatars bucket...");
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Error uploading file:", uploadError);

        // Handle specific error cases
        if (uploadError.message.includes("bucket not found")) {
          toast({
            title: "Upload failed",
            description:
              "The avatars storage bucket has not been created. Please contact your administrator.",
            variant: "destructive",
          });
          return;
        } else if (uploadError.message.includes("security policy")) {
          toast({
            title: "Upload failed",
            description:
              "You don't have permission to upload files. Please contact your administrator.",
            variant: "destructive",
          });
          return;
        } else {
          throw new Error("Failed to upload file: " + uploadError.message);
        }
      }

      // Update user profile with avatar URL
      const { error: updateError } = await supabase.from("profiles").upsert({
        id: userId,
        avatar_url: filePath,
        updated_at: new Date().toISOString(),
      });

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw new Error("Failed to update profile: " + updateError.message);
      }

      // Get the public URL
      await fetchAvatarUrl(filePath);

      // Trigger avatar update in the context
      triggerAvatarUpdate();

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload your profile picture.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle saving personal info
  const onSubmit = async (data: PersonalFormValues) => {
    try {
      setIsLoading(true);
      console.log("Saving personal data:", data);

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

      console.log("Saving profile for user ID:", userId);

      // Save to Supabase
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        updated_at: new Date().toISOString(),
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
        description:
          error.message || "There was a problem saving your changes.",
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
    getInitials,
    avatarUrl,
    uploadAvatar,
    isUploadingAvatar,
  };
};
