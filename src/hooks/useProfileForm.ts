import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { PersonalFormValues } from "@/components/settings/profile/PersonalInfoForm";
import { useAvatar } from "@/contexts/AvatarContext";
import { useAuth } from "@/contexts/AuthContext";
import { forceReloadAllAvatars } from "@/lib/avatar-utils";

// Constants for storage and caching
const AVATAR_UPDATE_KEY = "avatar_last_update";

export const useProfileForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { triggerAvatarUpdate } = useAvatar();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const userMeta = user?.user_metadata || {};
  const userEmail = user?.email || "";

  const form = useForm<PersonalFormValues>({
    defaultValues: {
      firstName: userMeta.first_name || "",
      lastName: userMeta.last_name || "",
      email: userEmail || "",
      phone: userMeta.phone || "",
    },
  });

  useEffect(() => {
    if (!user?.id) return;

    const loadProfileData = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          form.reset({
            firstName: data.first_name || form.getValues("firstName"),
            lastName: data.last_name || form.getValues("lastName"),
            email: data.email || form.getValues("email"),
            phone: data.phone || form.getValues("phone"),
          });

          if (data.avatar_url) {
            getAvatarUrl(data.avatar_url);
          }
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    };

    loadProfileData();
  }, [user?.id]);

  const getAvatarUrl = (path: string) => {
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    if (data?.publicUrl) {
      setAvatarUrl(data.publicUrl);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (isUploadingAvatar) return;

    try {
      setIsUploadingAvatar(true);

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const userId = user.id;

      // Check if profile exists first
      const { data: profileData, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId);

      if (profileCheckError) {
        console.error("Error checking profile existence:", profileCheckError);
      }

      const profileExists = profileData && profileData.length > 0;

      // Generate file path with timestamp to prevent caching issues
      const fileExt = file.name.split(".").pop();
      const timestamp = Date.now();
      const fileName = `${userId}-${timestamp}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Show local preview immediately
      const localPreview = URL.createObjectURL(file);
      setAvatarUrl(localPreview);

      // Upload the file to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "no-cache", // Prevent caching
          upsert: true,
        });

      if (uploadError) {
        throw new Error("Failed to upload file: " + uploadError.message);
      }

      // Update profile with the new avatar URL
      const profileUpdateData = {
        id: userId,
        avatar_url: filePath,
        updated_at: new Date().toISOString(),
      };

      let updateError;

      if (profileExists) {
        // Update existing profile
        const { error } = await supabase
          .from("profiles")
          .update(profileUpdateData)
          .eq("id", userId);
        updateError = error;
      } else {
        // Insert new profile
        const { error } = await supabase.from("profiles").insert({
          ...profileUpdateData,
          first_name: form.getValues("firstName") || "",
          last_name: form.getValues("lastName") || "",
          email: form.getValues("email") || user.email || "",
          created_at: new Date().toISOString(),
        });
        updateError = error;
      }

      if (updateError) {
        throw new Error("Failed to update profile: " + updateError.message);
      }

      // Clean up the local preview
      URL.revokeObjectURL(localPreview);

      // Aggressively clear all caches
      sessionStorage.clear(); // Clear all session storage

      // Clear specific avatar-related caches
      localStorage.removeItem(AVATAR_UPDATE_KEY);
      sessionStorage.removeItem(`avatar_${userId}`);
      sessionStorage.removeItem(`avatar_timestamp_${userId}`);

      // Force reload the avatar
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Get the public URL for the avatar with cache busting
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        // Add cache busting parameter
        const cacheBustUrl = `${urlData.publicUrl}?t=${timestamp}`;
        setAvatarUrl(cacheBustUrl);
      }

      // Use our utility function to force reload avatars across the app
      forceReloadAllAvatars();

      // Also do the standard triggers for backup
      triggerAvatarUpdate();

      setTimeout(() => {
        triggerAvatarUpdate();
      }, 500);

      setTimeout(() => {
        // One final force reload after a delay
        forceReloadAllAvatars();
      }, 1500);

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Profile upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload your profile picture.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const onSubmit = async (data: PersonalFormValues) => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const userId = user.id;

      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      await supabase.auth.updateUser({
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
        },
      });

      triggerAvatarUpdate();

      toast({
        title: "Personal information updated",
        description: "Your personal information has been saved successfully.",
      });
    } catch (error: any) {
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
    onSubmit,
    getInitials,
    avatarUrl,
    uploadAvatar,
    isUploadingAvatar,
  };
};
