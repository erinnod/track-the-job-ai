
import { ProfileForm } from "./profile/ProfileForm";
import { ProfessionalForm } from "./profile/ProfessionalForm";

export const ProfileTab = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ProfileForm />
      <ProfessionalForm />
    </div>
  );
};
