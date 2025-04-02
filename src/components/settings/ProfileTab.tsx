import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";

export const ProfileTab = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile form state
  const personalForm = useForm({
    defaultValues: {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567"
    }
  });

  const professionalForm = useForm({
    defaultValues: {
      title: "Senior Developer",
      company: "Tech Solutions Inc.",
      industry: "Information Technology",
      location: "San Francisco, CA"
    }
  });

  // Handle saving personal info
  const onPersonalSubmit = async (data) => {
    try {
      setIsLoading(true);
      console.log("Saving personal data:", data);
      
      // Save to Supabase - assumes you have a "profiles" table
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: (await supabase.auth.getUser()).data.user?.id,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          updated_at: new Date()
        });
      
      if (error) throw error;
      
      toast({
        title: "Personal information updated",
        description: "Your personal information has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving personal data:", error);
      toast({
        title: "Error saving information",
        description: "There was a problem saving your changes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving professional info
  const onProfessionalSubmit = async (data) => {
    try {
      setIsLoading(true);
      console.log("Saving professional data:", data);
      
      // Save to Supabase - assumes you have a "professional_details" table
      const { error } = await supabase
        .from('professional_details')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          title: data.title,
          company: data.company,
          industry: data.industry,
          location: data.location,
          updated_at: new Date()
        });
      
      if (error) throw error;
      
      toast({
        title: "Professional details updated",
        description: "Your professional details have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving professional data:", error);
      toast({
        title: "Error saving information",
        description: "There was a problem saving your changes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details here.</CardDescription>
        </CardHeader>
        <Form {...personalForm}>
          <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)}>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-3 mb-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xl">JD</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">Change Profile Picture</Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={personalForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={personalForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={personalForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={personalForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};
