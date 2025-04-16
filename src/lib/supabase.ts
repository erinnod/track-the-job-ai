import { createClient } from "@supabase/supabase-js";

// Debug mode flag - set to false to disable verbose logging
const DEBUG = false;

// Debug logger that only logs in development mode
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.debug(...args);
  }
};

// Supabase client setup
// Get URL and key from environment variables if available, otherwise fall back to defined values
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://kffbwemulhhsyaiooabh.supabase.co";

// Note: This is the public anon key, not a secret
// In production, use environment variables set in your deployment platform (Vercel, Netlify, etc.)
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmJ3ZW11bGhoc3lhaW9vYWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MDMzNTUsImV4cCI6MjA1OTE3OTM1NX0.CXa9wXaqwD7FVSnfUs120xD3NWg-GsNnBhwfbt4OSNg";

// Create Supabase client with additional configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "jobtrakr-auth-token",
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      "X-Client-Info": "jobtrakr-web-app",
    },
    fetch: (url, options) => {
      // Log all API requests to help debug Content Security Policy issues
      debugLog("Supabase fetch:", url, options?.method || "GET");

      // Add error handling for authentication issues
      return fetch(url, options)
        .then((response) => {
          // Check for authentication errors
          if (response.status === 403 && url.includes("/auth/v1/user")) {
            console.warn(
              "Auth token may be expired (403 Forbidden). Attempting refresh..."
            );
            // We'll let the AuthContext handle the refresh
          }

          return response;
        })
        .catch((error) => {
          // Handle network errors
          console.error("Fetch error:", error);
          throw error;
        });
    },
  },
});

// Cache for profile data
let profileDataCache: Record<string, any> = {};
let professionalDataCache: Record<string, any> = {};
const profileDataFetchPromise: Record<string, Promise<any>> = {}; // Store promises to prevent duplicate requests
const professionalDataFetchPromise: Record<string, Promise<any>> = {};
const CACHE_TIMESTAMP_KEY = "profile_cache_timestamp";
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes cache validity

// Cache for document data
let documentsCache: Record<string, any[]> = {};
const documentsFetchPromise: Record<string, Promise<any>> = {}; // Store promises to prevent duplicate requests
const DOCUMENTS_CACHE_KEY = "documents_cache";
const DOCUMENTS_TIMESTAMP_KEY = "documents_cache_timestamp";

// URL cache to avoid redundant fetching
let documentUrlCache: Record<string, string> = {};
const DOCUMENT_URLS_CACHE_KEY = "document_urls_cache";

// Add localStorage caching for true persistence between page loads
export const initializeLocalCache = () => {
  try {
    // Try to restore cache from localStorage
    const storedProfileCache = localStorage.getItem("profile_data_cache");
    const storedProfessionalCache = localStorage.getItem(
      "professional_data_cache"
    );
    const storedDocumentsCache = localStorage.getItem(DOCUMENTS_CACHE_KEY);
    const storedDocumentUrlsCache = localStorage.getItem(
      DOCUMENT_URLS_CACHE_KEY
    );

    if (storedProfileCache) {
      profileDataCache = JSON.parse(storedProfileCache);
      debugLog("Restored profile cache from localStorage");
    }

    if (storedProfessionalCache) {
      professionalDataCache = JSON.parse(storedProfessionalCache);
      debugLog("Restored professional cache from localStorage");
    }

    if (storedDocumentsCache) {
      documentsCache = JSON.parse(storedDocumentsCache);
      debugLog("Restored documents cache from localStorage");
    }

    if (storedDocumentUrlsCache) {
      documentUrlCache = JSON.parse(storedDocumentUrlsCache);
      debugLog("Restored document URLs cache from localStorage");
    }
  } catch (error) {
    console.error("Error initializing local cache:", error);
    // Reset caches if there was an error
    profileDataCache = {};
    professionalDataCache = {};
    documentsCache = {};
    documentUrlCache = {};
  }
};

// Initialize cache on module load
initializeLocalCache();

// Update localStorage when cache changes
const updateLocalStorage = () => {
  try {
    localStorage.setItem(
      "profile_data_cache",
      JSON.stringify(profileDataCache)
    );
    localStorage.setItem(
      "professional_data_cache",
      JSON.stringify(professionalDataCache)
    );
    localStorage.setItem(DOCUMENTS_CACHE_KEY, JSON.stringify(documentsCache));
    localStorage.setItem(
      DOCUMENT_URLS_CACHE_KEY,
      JSON.stringify(documentUrlCache)
    );
  } catch (error) {
    console.error("Error updating localStorage cache:", error);
  }
};

// Utility to preload user profile data
export const preloadUserProfileData = async (userId: string) => {
  if (!userId) return;

  // Check if data was recently cached
  const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  if (cacheTimestamp) {
    const cachedTime = parseInt(cacheTimestamp, 10);
    if (!isNaN(cachedTime) && Date.now() - cachedTime < CACHE_TIMEOUT) {
      debugLog("Using existing cache, still valid");
      return;
    }
  }

  try {
    // Fetch profile data in parallel
    await Promise.all([
      fetchProfileData(userId),
      fetchProfessionalData(userId),
    ]);

    // Update cache timestamp
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

    // Update localStorage
    updateLocalStorage();
  } catch (error) {
    console.error("Error preloading user profile data:", error);
  }
};

// Helper to fetch profile data with deduplication
const fetchProfileData = async (userId: string) => {
  // If a fetch is already in progress for this user, return the existing promise
  if (profileDataFetchPromise[userId]) {
    debugLog("Using existing profile fetch promise for", userId);
    return profileDataFetchPromise[userId];
  }

  try {
    // Create a new fetch promise and store it
    const fetchPromise = Promise.resolve(
      supabase.from("profiles").select("*").eq("id", userId).single()
    );

    // Store the promise for deduplication
    profileDataFetchPromise[userId] = fetchPromise;

    // Wait for the result
    const response = await fetchPromise;

    // Cache the result if successful
    if (!response.error && response.data) {
      profileDataCache[userId] = response.data;
      // Update localStorage
      updateLocalStorage();
    }

    // Return the response
    return response;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw error;
  } finally {
    // Clear the promise reference when done
    delete profileDataFetchPromise[userId];
  }
};

// Helper to fetch professional data with deduplication
const fetchProfessionalData = async (userId: string) => {
  // If a fetch is already in progress for this user, return the existing promise
  if (professionalDataFetchPromise[userId]) {
    debugLog("Using existing professional fetch promise for", userId);
    return professionalDataFetchPromise[userId];
  }

  try {
    // Create a new fetch promise and store it
    const fetchPromise = Promise.resolve(
      supabase
        .from("professional_details")
        .select("*")
        .eq("user_id", userId)
        .single()
    );

    // Store the promise for deduplication
    professionalDataFetchPromise[userId] = fetchPromise;

    // Wait for the result
    const response = await fetchPromise;

    // Cache the result if successful
    if (!response.error && response.data) {
      professionalDataCache[userId] = response.data;
      // Update localStorage
      updateLocalStorage();
    }

    // Return the response
    return response;
  } catch (error) {
    console.error("Error fetching professional data:", error);
    throw error;
  } finally {
    // Clear the promise reference when done
    delete professionalDataFetchPromise[userId];
  }
};

// Get cached profile data
export const getCachedProfileData = (userId: string) => {
  if (!profileDataCache[userId]) {
    // Trigger fetch in background if not cached
    setTimeout(() => {
      fetchProfileData(userId)
        .then(() => {})
        .catch((err) => console.error("Background profile fetch error:", err));
    }, 0);
  }
  return profileDataCache[userId] || null;
};

// Get cached professional data
export const getCachedProfessionalData = (userId: string) => {
  if (!professionalDataCache[userId]) {
    // Trigger fetch in background if not cached
    setTimeout(() => {
      fetchProfessionalData(userId)
        .then(() => {})
        .catch((err) =>
          console.error("Background professional fetch error:", err)
        );
    }, 0);
  }
  return professionalDataCache[userId] || null;
};

// Helper function to fetch documents with deduplication and caching
export const fetchUserDocuments = async (userId: string, fileType?: string) => {
  // Generate cache key based on user ID and optional file type
  const cacheKey = fileType ? `${userId}-${fileType}` : userId;

  // If a fetch is already in progress for this key, return the existing promise
  if (documentsFetchPromise[cacheKey]) {
    debugLog("Using existing documents fetch promise for", cacheKey);
    return documentsFetchPromise[cacheKey];
  }

  try {
    // Create a new fetch promise
    const fetchPromise = Promise.resolve(
      // Build the query
      supabase
        .from("user_documents")
        .select("*")
        .eq("user_id", userId)
        .then((response) => {
          if (response.error) {
            console.error("Error fetching documents:", response.error);
            return { data: [], error: response.error };
          }

          // Filter by file type if specified
          let documents = response.data || [];
          if (fileType && documents.length > 0) {
            documents = documents.filter((doc) => doc.file_type === fileType);
          }

          // Sort by most recent first
          documents.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );

          // Cache the results
          documentsCache[cacheKey] = documents;

          // Update localStorage
          updateLocalStorage();
          localStorage.setItem(DOCUMENTS_TIMESTAMP_KEY, Date.now().toString());

          return { data: documents, error: null };
        })
    );

    // Store the promise for deduplication
    documentsFetchPromise[cacheKey] = fetchPromise;

    // Return the promise
    return fetchPromise;
  } catch (error) {
    console.error("Error in fetchUserDocuments:", error);
    throw error;
  } finally {
    // Clear the promise reference when done
    setTimeout(() => {
      delete documentsFetchPromise[cacheKey];
    }, 0);
  }
};

// Get cached documents
export const getCachedDocuments = (userId: string, fileType?: string) => {
  const cacheKey = fileType ? `${userId}-${fileType}` : userId;

  // Check if we need to refresh the cache
  const cacheTimestamp = localStorage.getItem(DOCUMENTS_TIMESTAMP_KEY);
  const needsRefresh =
    !cacheTimestamp ||
    Date.now() - parseInt(cacheTimestamp, 10) > CACHE_TIMEOUT;

  // If we don't have cached data or it's stale, fetch in background
  if (!documentsCache[cacheKey] || needsRefresh) {
    setTimeout(() => {
      fetchUserDocuments(userId, fileType)
        .then(() => {})
        .catch((err) =>
          console.error("Background documents fetch error:", err)
        );
    }, 0);
  }

  // Return cached data (might be empty if first load)
  return documentsCache[cacheKey] || [];
};

// Get a cached document URL or null if not cached
export const getCachedDocumentUrl = (filePath: string): string | null => {
  return documentUrlCache[filePath] || null;
};

// Cache a document URL
export const cacheDocumentUrl = (filePath: string, url: string): void => {
  documentUrlCache[filePath] = url;
  updateLocalStorage();
};

// Get all cached document URLs
export const getAllCachedDocumentUrls = (): Record<string, string> => {
  return { ...documentUrlCache };
};

// Clear cache for a user
export const clearUserCache = (userId: string) => {
  delete profileDataCache[userId];
  delete professionalDataCache[userId];
  delete profileDataFetchPromise[userId];
  delete professionalDataFetchPromise[userId];

  // Clear document caches
  Object.keys(documentsCache).forEach((key) => {
    if (key.startsWith(userId)) {
      delete documentsCache[key];
    }
  });

  Object.keys(documentsFetchPromise).forEach((key) => {
    if (key.startsWith(userId)) {
      delete documentsFetchPromise[key];
    }
  });

  // Clear document URL caches for this user's documents
  // Note: This would require matching filePaths with user, so we'll just clear all URL cache on logout
  documentUrlCache = {};

  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  localStorage.removeItem(DOCUMENTS_TIMESTAMP_KEY);
  localStorage.removeItem("profile_data_cache");
  localStorage.removeItem("professional_data_cache");
  localStorage.removeItem(DOCUMENTS_CACHE_KEY);
  localStorage.removeItem(DOCUMENT_URLS_CACHE_KEY);
};
