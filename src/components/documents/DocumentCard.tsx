
import { FileText, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  dateUploaded: string;
  fileType: "resume" | "coverletter" | "other";
}

interface DocumentCardProps {
  document: Document;
  onDelete: (id: string) => void;
}

const DocumentCard = ({ document, onDelete }: DocumentCardProps) => {
  const getFileIcon = () => {
    if (document.type.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (document.type.includes('word') || document.type.includes('docx')) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    } else if (document.type.includes('image')) {
      return <FileText className="h-8 w-8 text-green-500" />;
    } else {
      return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex items-start p-3 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="mr-3 bg-gray-100 p-2 rounded">
        {getFileIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{document.name}</h4>
        <div className="flex items-center text-xs text-gray-500 mt-1">
          <span>{formatFileSize(document.size)}</span>
          <span className="mx-2">•</span>
          <span>{formatDistanceToNow(new Date(document.dateUploaded), { addSuffix: true })}</span>
        </div>
      </div>
      <div className="flex space-x-1">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Download className="h-4 w-4" />
          <span className="sr-only">Download</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete(document.id)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
};

export default DocumentCard;
