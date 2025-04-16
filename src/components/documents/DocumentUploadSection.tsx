import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, AlertCircle, Loader2 } from "lucide-react";
import DocumentCard from "./DocumentCard";
import { useDocuments } from "@/hooks/useDocuments";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentUploadSectionProps {
  title: string;
  description: string;
  fileType: "resume" | "coverletter" | "other";
  acceptedFileTypes: string;
}

const DocumentUploadSection = ({
  title,
  description,
  fileType,
  acceptedFileTypes,
}: DocumentUploadSectionProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { toast } = useToast();
  const {
    documents,
    isLoading,
    isUploading,
    error,
    uploadDocument,
    deleteDocument,
  } = useDocuments({ fileType });

  // Mark initial load as complete after first render
  useEffect(() => {
    // Make initial load faster - minimal delay
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 100); // Reduced from 500ms to 100ms

    return () => clearTimeout(timer);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const accepted = acceptedFileTypes.split(",");
    const newFiles = Array.from(files).filter((file) => {
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      return accepted.includes(extension);
    });

    if (newFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: `Please upload only ${acceptedFileTypes.replace(
          /\./g,
          ""
        )} files.`,
        variant: "destructive",
      });

      if (newFiles.length === 0) return;
    }

    // Show a toast with progress info for multiple files
    if (newFiles.length > 1) {
      toast({
        title: "Uploading documents",
        description: `Uploading ${newFiles.length} files...`,
      });
    }

    // Upload each file
    for (const file of newFiles) {
      // For single file, show file-specific info
      if (newFiles.length === 1) {
        toast({
          title: "Uploading document",
          description: `Uploading ${file.name}...`,
        });
      }
      await uploadDocument(file, fileType);
    }
  };

  // Render document cards or skeletons
  const renderDocumentList = () => {
    // If we have no documents and loading is complete, show empty state
    if (!isLoading && documents.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No documents uploaded yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Upload your first document to get started.
          </p>
        </div>
      );
    }

    // Show documents immediately, even during initial load
    if (documents.length > 0) {
      return (
        <div className="space-y-4">
          <h3 className="font-medium">
            Uploaded Documents
            {isLoading && (
              <Loader2 className="h-4 w-4 inline ml-2 animate-spin text-primary" />
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDelete={deleteDocument}
              />
            ))}
          </div>
        </div>
      );
    }

    // Only show skeleton if we're still in initial load AND don't have documents yet
    if (initialLoad && isLoading) {
      return (
        <div className="space-y-4">
          <h3 className="font-medium">Uploaded Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start p-3 border rounded-lg">
                <Skeleton className="h-12 w-12 mr-3 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex space-x-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default loading state if no other condition matches
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-gray-500">Loading documents...</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="mx-auto flex flex-col items-center justify-center space-y-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">
              Drag files here or click to upload
            </h3>
            <p className="text-sm text-gray-500">
              Supported formats: {acceptedFileTypes.replace(/\./g, "")}
            </p>
            <input
              type="file"
              id={`file-upload-${fileType}`}
              className="hidden"
              multiple
              accept={acceptedFileTypes}
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              onClick={() =>
                document.getElementById(`file-upload-${fileType}`)?.click()
              }
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Files
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {renderDocumentList()}
      </CardContent>
    </Card>
  );
};

export default DocumentUploadSection;
