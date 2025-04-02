
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarSectionProps {
  getInitials: () => string;
}

export const AvatarSection = ({ getInitials }: AvatarSectionProps) => {
  return (
    <div className="flex flex-col items-center space-y-3 mb-6">
      <Avatar className="h-24 w-24">
        <AvatarImage src="" />
        <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
      </Avatar>
      <Button variant="outline" size="sm">Change Profile Picture</Button>
    </div>
  );
};
