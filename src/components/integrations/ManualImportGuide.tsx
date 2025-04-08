import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  importLinkedInManually,
  importIndeedManually,
} from "@/services/integrationService";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CircleCheck,
  CircleHelp,
  FileText,
  Linkedin,
  Briefcase,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const ManualImportGuide = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("linkedin");
  const [loading, setLoading] = useState(false);
  const [instructions, setInstructions] = useState<string | null>(null);

  const startImport = async (platform: "linkedin" | "indeed") => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to import your job applications.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result =
        platform === "linkedin"
          ? await importLinkedInManually(user.id)
          : await importIndeedManually(user.id);

      if (result.success) {
        setInstructions(result.message);
      } else {
        toast({
          title: "Import Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error importing from ${platform}:`, error);
      toast({
        title: "Import Failed",
        description: `There was an error importing your data from ${platform}.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddManually = () => {
    navigate("/applications/new");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Import Job Applications</CardTitle>
        <CardDescription>
          Import your job applications from LinkedIn and Indeed
        </CardDescription>
      </CardHeader>
      <CardContent>
        {instructions ? (
          <div className="space-y-4">
            <Alert>
              <CircleCheck className="h-4 w-4" />
              <AlertTitle>Manual Import Instructions</AlertTitle>
              <AlertDescription className="whitespace-pre-line mt-2">
                {instructions}
              </AlertDescription>
            </Alert>
            <div className="flex justify-center mt-6">
              <Button onClick={handleAddManually} className="mx-2">
                <FileText className="mr-2 h-4 w-4" />
                Add Job Manually
              </Button>
            </div>
          </div>
        ) : (
          <Tabs
            defaultValue="linkedin"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              <TabsTrigger value="indeed">Indeed</TabsTrigger>
            </TabsList>
            <TabsContent value="linkedin" className="space-y-4 mt-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium flex items-center">
                  <Linkedin className="mr-2 h-5 w-5 text-[#0077B5]" />
                  LinkedIn Job Applications
                </h3>
                <p className="text-sm mt-2">
                  Import your saved and applied jobs from LinkedIn to track them
                  in JobTrakr.
                </p>
                <div className="mt-4">
                  <Button
                    onClick={() => startImport("linkedin")}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading && activeTab === "linkedin"
                      ? "Starting Import..."
                      : "Start LinkedIn Import"}
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="indeed" className="space-y-4 mt-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium flex items-center">
                  <Briefcase className="mr-2 h-5 w-5 text-[#003A9B]" />
                  Indeed Job Applications
                </h3>
                <p className="text-sm mt-2">
                  Import your saved and applied jobs from Indeed to track them
                  in JobTrakr.
                </p>
                <div className="mt-4">
                  <Button
                    onClick={() => startImport("indeed")}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading && activeTab === "indeed"
                      ? "Starting Import..."
                      : "Start Indeed Import"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <CircleHelp className="mr-2 h-4 w-4" />
          Job data is only imported when you explicitly request it
        </div>
      </CardFooter>
    </Card>
  );
};

export default ManualImportGuide;
