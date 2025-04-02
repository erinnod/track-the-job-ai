
import { useProfileForm } from "@/hooks/useProfileForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AvatarSection } from "./AvatarSection";
import { PersonalInfoForm } from "./PersonalInfoForm";

export const ProfileForm = () => {
  const { form, isLoading, isInitializing, onSubmit, getInitials } = useProfileForm();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your personal details here.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <AvatarSection getInitials={getInitials} />
            <PersonalInfoForm form={form} />
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
