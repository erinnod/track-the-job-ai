import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  dateUploaded: string;
  fileType: "resume" | "coverletter" | "other";
  filePath?: string;
  url?: string;
}

interface UseDocumentsProps {
  fileType?: "resume" | "coverletter" | "other";
}

export const useDocuments = ({ fileType }: UseDocumentsProps = {}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDocuments = async () => {
    if (!user) {
      setDocuments([]);
      return;
    }

    setIsLoading(true);
    try {
      // Build the query
      let query = supabase
        .from("user_documents")
        .select("*")
        .eq("user_id", user.id);

      // Add file type filter if specified
      if (fileType) {
        query = query.eq("file_type", fileType);
      }

      // Order by most recent first
      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching documents:", error);
        toast({
          title: "Error",
          description: "Failed to load documents. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        // Transform data to match our Document interface
        const transformedDocs = await Promise.all(
          data.map(async (doc) => {
            // Get the public URL for each document
            const { data: urlData } = await supabase.storage
              .from("documents")
              .getPublicUrl(doc.file_path);

            return {
              id: doc.id,
              name: doc.name,
              type: doc.mime_type,
              size: doc.size,
              dateUploaded: doc.created_at,
              fileType: doc.file_type,
              filePath: doc.file_path,
              url: urlData?.publicUrl,
            };
          })
        );

        setDocuments(transformedDocs);
      }
    } catch (error) {
      console.error("Exception fetching documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (
    file: File,
    docFileType: "resume" | "coverletter" | "other"
  ) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload documents.",
        variant: "destructive",
      });
      return null;
    }

    setIsUploading(true);
    try {
      const userId = user.id;

      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}.${fileExt}`;
      const filePath = `${userId}/${docFileType}/${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Error uploading file:", uploadError);

        if (uploadError.message.includes("bucket not found")) {
          toast({
            title: "Upload failed",
            description:
              "The documents storage bucket has not been created. Please contact your administrator.",
            variant: "destructive",
          });
          return null;
        } else {
          throw new Error("Failed to upload file: " + uploadError.message);
        }
      }

      // Insert record into user_documents table
      const { data: docData, error: docError } = await supabase
        .from("user_documents")
        .insert({
          user_id: userId,
          name: file.name,
          mime_type: file.type,
          size: file.size,
          file_type: docFileType,
          file_path: filePath,
        })
        .select("*")
        .single();

      if (docError) {
        console.error("Error saving document record:", docError);
        throw new Error("Failed to save document record: " + docError.message);
      }

      if (!docData) {
        throw new Error("No data returned after inserting document record");
      }

      // Get public URL
      const { data: urlData } = await supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      const newDocument: Document = {
        id: docData.id,
        name: file.name,
        type: file.type,
        size: file.size,
        dateUploaded: docData.created_at,
        fileType: docFileType,
        filePath: filePath,
        url: urlData?.publicUrl,
      };

      // Update state
      setDocuments((prev) => [newDocument, ...prev]);

      toast({
        title: "Document uploaded",
        description: "Your document has been successfully uploaded.",
      });

      return newDocument;
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload your document.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!user) return false;

    try {
      // Find the document to delete
      const documentToDelete = documents.find((doc) => doc.id === id);

      if (!documentToDelete || !documentToDelete.filePath) {
        throw new Error("Document not found or file path missing");
      }

      // Delete from Supabase storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([documentToDelete.filePath]);

      if (storageError) {
        console.error("Error deleting file from storage:", storageError);
        throw new Error(
          "Failed to delete file from storage: " + storageError.message
        );
      }

      // Delete the record from the database
      const { error: dbError } = await supabase
        .from("user_documents")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (dbError) {
        console.error("Error deleting document record:", dbError);
        throw new Error("Failed to delete document record: " + dbError.message);
      }

      // Update the UI
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));

      toast({
        title: "Document deleted",
        description: "The document has been removed.",
      });

      return true;
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Could not delete your document.",
        variant: "destructive",
      });
      return false;
    }
  };

  const downloadDocument = async (id: string) => {
    try {
      const document = documents.find((doc) => doc.id === id);

      if (!document || !document.filePath) {
        throw new Error("Document not found or file path missing");
      }

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

      // Open the file in a new tab (better UX than direct download for many file types)
      window.open(data.signedUrl, "_blank");

      return true;
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast({
        title: "Download failed",
        description: error.message || "Could not download the document.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Load documents when the component mounts or user changes
  useEffect(() => {
    fetchDocuments();
  }, [user, fileType]);

  return {
    documents,
    isLoading,
    isUploading,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    refreshDocuments: fetchDocuments,
  };
};
