import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface AvatarSectionProps {
  getInitials: () => string;
  avatarUrl: string | null;
  onAvatarChange: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export const AvatarSection = ({
  getInitials,
  avatarUrl,
  onAvatarChange,
  isUploading = false,
}: AvatarSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Check file type
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Maximum size is 5MB");
        return;
      }

      // Create a preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Upload the file
      await onAvatarChange(file);

      // Clear the file input
      e.target.value = "";
    }
  };

  // Use previewUrl if available, otherwise use the avatarUrl from props
  const displayUrl = previewUrl || avatarUrl;

  return (
    <div className="flex flex-col items-center space-y-3 mb-6">
      <Avatar className="h-24 w-24 border">
        {displayUrl ? (
          <AvatarImage src={displayUrl} alt="Profile picture" />
        ) : null}
        <AvatarFallback className="text-xl bg-blue-100 text-blue-700">
          {getInitials()}
        </AvatarFallback>
      </Avatar>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={handleButtonClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          "Change Profile Picture"
        )}
      </Button>
    </div>
  );
};
