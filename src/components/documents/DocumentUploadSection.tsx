
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2 } from "lucide-react";
import DocumentCard from "./DocumentCard";

interface DocumentUploadSectionProps {
  title: string;
  description: string;
  fileType: "resume" | "coverletter" | "other";
  acceptedFileTypes: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  dateUploaded: string;
  fileType: "resume" | "coverletter" | "other";
}

const DocumentUploadSection = ({ 
  title, 
  description, 
  fileType, 
  acceptedFileTypes 
}: DocumentUploadSectionProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

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

  const handleFiles = (files: FileList) => {
    const accepted = acceptedFileTypes.split(",");
    const newFiles = Array.from(files).filter(file => {
      const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      return accepted.includes(extension);
    });

    if (newFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: `Please upload only ${acceptedFileTypes.replace(/\./g, "")} files.`,
        variant: "destructive"
      });
      
      if (newFiles.length === 0) return;
    }

    const newDocuments = newFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      dateUploaded: new Date().toISOString(),
      fileType
    }));

    setDocuments(prev => [...prev, ...newDocuments]);
    
    toast({
      title: "Document uploaded",
      description: `${newFiles.length} file(s) successfully uploaded.`
    });
  };

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast({
      title: "Document deleted",
      description: "The document has been removed."
    });
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
            <h3 className="text-lg font-semibold">Drag files here or click to upload</h3>
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
              onClick={() => document.getElementById(`file-upload-${fileType}`)?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose Files
            </Button>
          </div>
        </div>

        {documents.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Uploaded Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map(doc => (
                <DocumentCard 
                  key={doc.id} 
                  document={doc} 
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUploadSection;
