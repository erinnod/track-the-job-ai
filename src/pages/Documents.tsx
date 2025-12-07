import { useState, useEffect, useRef } from "react";
import Layout from "@/components/layout/Layout";
import DocumentUploadSection from "@/components/documents/DocumentUploadSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserDocuments, getCachedDocuments } from "@/lib/supabase";
import { fetchUserAIContent } from "@/lib/ai-service";
import { AIGeneratedContent } from "@/types/ai";
import ResumeAITailoringForm from "@/components/ai/ResumeAITailoringForm";
import CoverLetterAIForm from "@/components/ai/CoverLetterAIForm";
import AIContentDisplay from "@/components/ai/AIContentDisplay";
import CreditsDisplay from "@/components/payment/CreditsDisplay";
import { Sparkles, FileText, Clock } from "lucide-react";
import { Document } from "@/hooks/useDocuments";

const Documents = () => {
  const { user } = useAuth();
  const hasLoadedRef = useRef(false);
  const [aiResumes, setAiResumes] = useState<AIGeneratedContent[]>([]);
  const [aiCoverLetters, setAiCoverLetters] = useState<AIGeneratedContent[]>(
    []
  );
  const [isLoadingAI, setIsLoadingAI] = useState(true);
  const [selectedResume, setSelectedResume] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Preload documents data for all tabs when page loads, but only once
  useEffect(() => {
    if (!user?.id || hasLoadedRef.current) return;

    // Mark as loaded immediately to prevent duplicate loading
    hasLoadedRef.current = true;

    // Use cached docs first for immediate UI rendering
    const cachedResumes = getCachedDocuments(user.id, "resume");
    const cachedCoverLetters = getCachedDocuments(user.id, "coverletter");
    const cachedOthers = getCachedDocuments(user.id, "other");

    // Check if we need to load documents (only fetch if cache is empty)
    const loadDocuments = async () => {
      try {
        // Sequential fetching with delays to prevent API overload
        // Only fetch categories that aren't already cached
        if (cachedResumes.length === 0) {
          await fetchUserDocuments(user.id, "resume");
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (cachedCoverLetters.length === 0) {
          await fetchUserDocuments(user.id, "coverletter");
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (cachedOthers.length === 0) {
          await fetchUserDocuments(user.id, "other");
        }
      } catch (error) {
        console.error("Error loading documents:", error);
      }
    };

    loadDocuments();
    loadAIContent();
  }, [user?.id]);

  // Load AI generated content
  const loadAIContent = async () => {
    if (!user?.id) return;

    setIsLoadingAI(true);
    try {
      // Fetch AI resumes
      const aiResumesContent = await fetchUserAIContent(user.id, "resume");
      setAiResumes(aiResumesContent);

      // Fetch AI cover letters
      const aiCoverLettersContent = await fetchUserAIContent(
        user.id,
        "cover_letter"
      );
      setAiCoverLetters(aiCoverLettersContent);
    } catch (error) {
      console.error("Error loading AI content:", error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleResumeSelect = (document: Document) => {
    setSelectedResume({
      id: document.id,
      name: document.name,
    });
  };

  return (
    <Layout>
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
            <p className="text-sm text-gray-500 mt-1">
              Upload and manage your job application documents
            </p>
          </div>
          <div className="hidden">
            <CreditsDisplay variant="inline" />
          </div>
        </div>

        <Tabs defaultValue="resumes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="resumes">Resumes/CVs</TabsTrigger>
            <TabsTrigger value="coverletters">Cover Letters</TabsTrigger>
            <TabsTrigger value="other">Other Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="resumes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <DocumentUploadSection
                  title="Resume/CV"
                  description="Upload your professional resume or CV. We support PDF, DOCX, and TXT formats."
                  fileType="resume"
                  acceptedFileTypes=".pdf,.docx,.txt"
                  onDocumentClick={handleResumeSelect}
                />
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-primary" />
                      AI Features
                    </CardTitle>
                    <CardDescription>
                      Use AI to enhance your resume
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ResumeAITailoringForm
                      documentId={selectedResume?.id}
                      documentName={selectedResume?.name}
                      onComplete={loadAIContent}
                    />
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground">
                    {selectedResume ? (
                      <div className="flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        Using: {selectedResume.name}
                      </div>
                    ) : (
                      <div>Select a resume to use AI features</div>
                    )}
                  </CardFooter>
                </Card>

                {aiResumes.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Recent AI Tailored Resumes
                    </h3>
                    <div className="space-y-3">
                      {aiResumes.slice(0, 3).map((resume) => (
                        <AIContentDisplay
                          key={resume.id}
                          content={resume}
                          onDelete={loadAIContent}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="coverletters" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <DocumentUploadSection
                  title="Cover Letters"
                  description="Upload your cover letters. These can be tailored for different job applications."
                  fileType="coverletter"
                  acceptedFileTypes=".pdf,.docx,.txt"
                />
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-primary" />
                      AI Features
                    </CardTitle>
                    <CardDescription>
                      Generate customized cover letters
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CoverLetterAIForm
                      resumeId={selectedResume?.id}
                      resumeName={selectedResume?.name}
                      onComplete={loadAIContent}
                    />
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground">
                    {selectedResume ? (
                      <div className="flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        Using resume: {selectedResume.name}
                      </div>
                    ) : (
                      <div>Select a resume from the Resume tab first</div>
                    )}
                  </CardFooter>
                </Card>

                {aiCoverLetters.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Recent AI Cover Letters
                    </h3>
                    <div className="space-y-3">
                      {aiCoverLetters.slice(0, 3).map((coverLetter) => (
                        <AIContentDisplay
                          key={coverLetter.id}
                          content={coverLetter}
                          onDelete={loadAIContent}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="other" className="space-y-4">
            <DocumentUploadSection
              title="Other Documents"
              description="Upload certificates, recommendation letters, portfolios or other important documents."
              fileType="other"
              acceptedFileTypes=".pdf,.docx,.jpg,.png,.zip"
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Documents;
