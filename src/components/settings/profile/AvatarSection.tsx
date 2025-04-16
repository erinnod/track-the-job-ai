import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

export const AvatarSection = ({
  getInitials,
  avatarUrl,
  onAvatarChange,
  isUploading,
}: {
  getInitials: () => string;
  avatarUrl: string | null;
  onAvatarChange: (file: File) => void;
  isUploading: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAvatarChange(file);
    }
  };

  // Handle button click to open file picker
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-3 mb-6">
      <div className="relative">
        <Avatar className="h-24 w-24 border">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt="Profile picture" />
          ) : null}
          <AvatarFallback className="text-xl bg-blue-100 text-blue-700">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

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
