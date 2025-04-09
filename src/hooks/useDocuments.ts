import { useState, useEffect, useRef, useCallback } from "react";
import {
  supabase,
  fetchUserDocuments,
  getCachedDocuments,
  getCachedDocumentUrl,
  cacheDocumentUrl,
  getAllCachedDocumentUrls,
} from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Cache for document URLs to avoid redundant fetching
const urlCache = new Map<string, string>();

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
  const [error, setError] = useState<string | null>(null);
  const previousUserId = useRef<string | null>(null);
  const previousFileType = useRef<string | null>(null);
  const isMounted = useRef(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Clear component state on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchDocuments = useCallback(async () => {
    // Skip if no user
    if (!user) {
      if (isMounted.current) {
        setDocuments([]);
        setError(null);
      }
      return;
    }

    // Skip if same user and same file type (prevents refetches on re-renders)
    if (
      previousUserId.current === user.id &&
      previousFileType.current === fileType
    ) {
      return;
    }

    // Update refs to prevent redundant fetches
    previousUserId.current = user.id;
    previousFileType.current = fileType || null;

    if (isMounted.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      // First check if we have cached documents - show these immediately
      const cachedDocs = getCachedDocuments(user.id, fileType);

      if (cachedDocs.length > 0) {
        // Transform cached documents to our Document interface
        const transformedDocs: Document[] = cachedDocs.map((doc) => ({
          id: doc.id,
          name: doc.name,
          type: doc.mime_type,
          size: doc.size,
          dateUploaded: doc.created_at,
          fileType: doc.file_type,
          filePath: doc.file_path,
          // Check URL cache first for immediate rendering
          url: doc.file_path ? urlCache.get(doc.file_path) || "" : "",
        }));

        // Set documents immediately from cache
        if (isMounted.current) {
          setDocuments(transformedDocs);
          setIsLoading(false);
        }

        // Create a map to quickly locate documents by file path
        const documentMap = new Map();
        transformedDocs.forEach((doc) => {
          if (doc.filePath) {
            documentMap.set(doc.filePath, doc);
          }
        });

        // Only fetch URLs for documents that don't have cached URLs
        const docsNeedingUrls = transformedDocs.filter(
          (doc) => doc.filePath && !doc.url
        );

        if (docsNeedingUrls.length > 0) {
          // Fetch URLs in the background (in batches)
          setTimeout(() => {
            fetchDocumentUrls(docsNeedingUrls, documentMap);
          }, 0);
        }

        // Always fetch fresh data in the background to ensure we're up to date
        fetchFreshDocuments();
        return;
      }

      // No cached documents, fetch fresh data
      await fetchFreshDocuments();
    } catch (error) {
      console.error("Exception fetching documents:", error);
      if (isMounted.current) {
        setError("An unexpected error occurred. Please try again.");
        setIsLoading(false);
      }
    }
  }, [user, fileType, toast]);

  // Helper to fetch document URLs
  const fetchDocumentUrls = async (
    docs: Document[],
    documentMap: Map<string, Document>
  ) => {
    try {
      const batchSize = 15; // Increased batch size for better performance
      const filePaths = docs
        .map((doc) => doc.filePath)
        .filter(Boolean) as string[];

      // Skip processing if no paths to fetch
      if (filePaths.length === 0) return;

      for (let i = 0; i < filePaths.length; i += batchSize) {
        const batchPaths = filePaths.slice(i, i + batchSize);
        const pathsToFetch = batchPaths.filter((path) => !urlCache.has(path));

        if (pathsToFetch.length > 0) {
          // Fetch URLs in parallel for the batch
          const urlPromises = pathsToFetch.map((path) =>
            supabase.storage.from("documents").getPublicUrl(path)
          );

          const urlResults = await Promise.all(urlPromises);

          // Update document URLs and cache
          urlResults.forEach((result, index) => {
            const path = pathsToFetch[index];
            const doc = documentMap.get(path);

            if (doc && result.data?.publicUrl) {
              doc.url = result.data.publicUrl;
              // Cache the URL for future use
              urlCache.set(path, result.data.publicUrl);
            }
          });
        }

        // For paths already in cache, update from cache
        batchPaths.forEach((path) => {
          if (urlCache.has(path)) {
            const doc = documentMap.get(path);
            if (doc) {
              doc.url = urlCache.get(path) || "";
            }
          }
        });

        // Update state with documents including URLs
        if (isMounted.current) {
          setDocuments([...docs]);
        }
      }
    } catch (error) {
      console.error("Error fetching document URLs:", error);
    }
  };

  // Helper to fetch fresh documents from the server
  const fetchFreshDocuments = async () => {
    try {
      // Use the new fetchUserDocuments helper
      const { data, error: fetchError } = await fetchUserDocuments(
        user!.id,
        fileType
      );

      // Handle error fetching documents
      if (fetchError) {
        console.error("Error fetching documents:", fetchError);

        if (!isMounted.current) return;

        // Handle specific errors
        if (fetchError.code === "PGRST301") {
          setError(
            "The documents table does not exist. Please contact support."
          );
        } else {
          setError("Failed to load documents. Please try again.");
        }

        setDocuments([]);
        return;
      }

      if (!data || !data.length) {
        if (isMounted.current) {
          setDocuments([]);
          setIsLoading(false);
        }
        return;
      }

      // Transform to our Document interface
      const transformedDocs: Document[] = data.map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.mime_type,
        size: doc.size,
        dateUploaded: doc.created_at,
        fileType: doc.file_type,
        filePath: doc.file_path,
        // Check URL cache first for immediate rendering
        url: doc.file_path ? urlCache.get(doc.file_path) || "" : "",
      }));

      // Set documents with fresh data
      if (isMounted.current) {
        setDocuments(transformedDocs);
        setIsLoading(false);
      }

      // Create a map to quickly locate documents by file path
      const documentMap = new Map();
      transformedDocs.forEach((doc) => {
        if (doc.filePath) {
          documentMap.set(doc.filePath, doc);
        }
      });

      // Only fetch URLs for documents that don't have cached URLs
      const docsNeedingUrls = transformedDocs.filter(
        (doc) => doc.filePath && !doc.url
      );

      if (docsNeedingUrls.length > 0) {
        // Fetch URLs
        fetchDocumentUrls(docsNeedingUrls, documentMap);
      }
    } catch (error) {
      console.error("Exception fetching fresh documents:", error);
      if (isMounted.current) {
        setError("An unexpected error occurred. Please try again.");
        setIsLoading(false);
      }
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

        // Try to clean up the uploaded file if database insert fails
        await supabase.storage.from("documents").remove([filePath]);

        throw new Error("Failed to save document record: " + docError.message);
      }

      if (!docData) {
        throw new Error("No data returned after inserting document record");
      }

      // Get public URL
      const { data: urlData } = await supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // Create new document object
      const newDoc: Document = {
        id: docData.id,
        name: docData.name,
        type: docData.mime_type,
        size: docData.size,
        dateUploaded: docData.created_at,
        fileType: docData.file_type,
        filePath: docData.file_path,
        url: urlData?.publicUrl || "",
      };

      // Add the new document to the list and resort
      setDocuments((prevDocs) => {
        const updatedDocs = [newDoc, ...prevDocs];
        return updatedDocs;
      });

      // Force refresh cached documents to include the new document
      fetchUserDocuments(userId, docFileType);

      toast({
        title: "Document uploaded",
        description: "Your document was uploaded successfully.",
      });

      return newDoc;
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload your document.",
        variant: "destructive",
      });
      return null;
    } finally {
      if (isMounted.current) {
        setIsUploading(false);
      }
    }
  };

  const deleteDocument = async (id: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete documents.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Find the document in our local state
      const docToDelete = documents.find((doc) => doc.id === id);
      if (!docToDelete) {
        throw new Error("Document not found");
      }

      // Get file path to delete from storage
      const filePath = docToDelete.filePath;

      // Delete document from database
      const { error: deleteError } = await supabase
        .from("user_documents")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw new Error(
          "Failed to delete document record: " + deleteError.message
        );
      }

      // Delete file from storage if we have a file path
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from("documents")
          .remove([filePath]);

        if (storageError) {
          console.error("Error deleting file from storage:", storageError);
          // Don't throw an error here, as we've already deleted the database record
        }
      }

      // Update state
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));

      // Force refresh the cache to reflect the deletion
      const docType = docToDelete.fileType;
      fetchUserDocuments(user.id, docType);

      toast({
        title: "Document deleted",
        description: "Your document was deleted successfully.",
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

  // Load documents when the component mounts or user/fileType changes
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    isLoading,
    isUploading,
    error,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    refreshDocuments: fetchDocuments,
  };
};
