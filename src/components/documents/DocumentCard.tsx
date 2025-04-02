import { FileText, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Document } from "@/hooks/useDocuments";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface DocumentCardProps {
  document: Document;
  onDelete: (id: string) => Promise<boolean>;
}

const DocumentCard = ({ document, onDelete }: DocumentCardProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const getFileIcon = () => {
    if (document.type.includes("pdf")) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (
      document.type.includes("word") ||
      document.type.includes("docx")
    ) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    } else if (document.type.includes("image")) {
      return <FileText className="h-8 w-8 text-green-500" />;
    } else {
      return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = async () => {
    if (!document.filePath) {
      toast({
        title: "Download failed",
        description: "File path is missing",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);

    try {
      // Get a signed URL for the file (valid for 60 seconds)
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(document.filePath, 60);

      if (error) {
        console.error("Error getting signed URL:", error);
        throw new Error("Could not generate download link");
      }

      if (!data?.signedUrl) {
        throw new Error("No signed URL returned");
      }

      // Create a temporary anchor to trigger the download
      const link = window.document.createElement("a");
      link.href = data.signedUrl;
      link.download = document.name;
      // Open in a new tab
      link.target = "_blank";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      toast({
        title: "Download started",
        description: "Your document is downloading",
      });
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast({
        title: "Download failed",
        description: error.message || "Could not download your document",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(document.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-start p-3 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="mr-3 bg-gray-100 p-2 rounded">{getFileIcon()}</div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{document.name}</h4>
        <div className="flex items-center text-xs text-gray-500 mt-1">
          <span>{formatFileSize(document.size)}</span>
          <span className="mx-2">•</span>
          <span>
            {formatDistanceToNow(new Date(document.dateUploaded), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
      <div className="flex space-x-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleDownload}
          disabled={isDownloading || !document.filePath}
        >
          <Download
            className={`h-4 w-4 ${isDownloading ? "animate-pulse" : ""}`}
          />
          <span className="sr-only">Download</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className={`h-4 w-4 ${isDeleting ? "animate-pulse" : ""}`} />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
};

export default DocumentCard;
