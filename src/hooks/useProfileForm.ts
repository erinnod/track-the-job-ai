import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { PersonalFormValues } from "@/components/settings/profile/PersonalInfoForm";
import { useAvatar } from "@/contexts/AvatarContext";
import { useAuth } from "@/contexts/AuthContext";

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

      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const localPreview = URL.createObjectURL(file);
      setAvatarUrl(localPreview);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw new Error("Failed to upload file");
      }

      await supabase.from("profiles").upsert({
        id: userId,
        avatar_url: filePath,
        updated_at: new Date().toISOString(),
      });

      URL.revokeObjectURL(localPreview);

      getAvatarUrl(filePath);

      triggerAvatarUpdate();

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
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
