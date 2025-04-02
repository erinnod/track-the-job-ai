import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2 } from "lucide-react";
import DocumentCard from "./DocumentCard";
import { useDocuments } from "@/hooks/useDocuments";

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
  const { toast } = useToast();
  const { documents, isLoading, isUploading, uploadDocument, deleteDocument } =
    useDocuments({ fileType });

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
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading..." : "Choose Files"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <p className="text-sm text-gray-500">Loading documents...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-medium">Uploaded Documents</h3>
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
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No documents uploaded yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUploadSection;
