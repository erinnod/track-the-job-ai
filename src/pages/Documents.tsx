import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import DocumentUploadSection from "@/components/documents/DocumentUploadSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserDocuments } from "@/lib/supabase";

const Documents = () => {
  const { user } = useAuth();

  // Preload documents data for all tabs when page loads
  useEffect(() => {
    if (user?.id) {
      // Fetch all document types in parallel
      const preloadDocuments = async () => {
        try {
          await Promise.all([
            fetchUserDocuments(user.id, "resume"),
            fetchUserDocuments(user.id, "coverletter"),
            fetchUserDocuments(user.id, "other"),
          ]);
        } catch (error) {
          console.error("Error preloading documents:", error);
        }
      };

      preloadDocuments();
    }
  }, [user?.id]);

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
        </div>

        <Tabs defaultValue="resumes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="resumes">Resumes/CVs</TabsTrigger>
            <TabsTrigger value="coverletters">Cover Letters</TabsTrigger>
            <TabsTrigger value="other">Other Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="resumes" className="space-y-4">
            <DocumentUploadSection
              title="Resume/CV"
              description="Upload your professional resume or CV. We support PDF, DOCX, and TXT formats."
              fileType="resume"
              acceptedFileTypes=".pdf,.docx,.txt"
            />
          </TabsContent>

          <TabsContent value="coverletters" className="space-y-4">
            <DocumentUploadSection
              title="Cover Letters"
              description="Upload your cover letters. These can be tailored for different job applications."
              fileType="coverletter"
              acceptedFileTypes=".pdf,.docx,.txt"
            />
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
