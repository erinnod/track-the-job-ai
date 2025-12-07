/**
 * Job Context Provider
 *
 * This context provides job application data management functionality throughout the application.
 * It handles:
 * - Loading job applications from the database
 * - Adding, updating, and deleting job applications
 * - Caching job data for better performance
 * - Managing loading states and error handling
 *
 * The context uses Supabase as the backend database and implements
 * optimistic updates for a better user experience.
 */

//=============================================================================
// IMPORTS
//=============================================================================

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { JobApplication, mockJobs } from "@/data/mockJobs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";

//=============================================================================
// TYPE DEFINITIONS
//=============================================================================

/**
 * Database representation of a job application
 * This matches the schema in Supabase
 */
interface JobApplicationDB {
  id: string;
  user_id: string;
  company: string;
  position: string;
  location: string | null;
  status: string;
  applied_date: string | null;
  last_updated: string;
  company_website: string | null;
  salary: string | null;
  job_description: string | null;
  work_type: string | null;
  employment_type: string | null;
  remote: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Database representation of a job event
 * This matches the schema in Supabase
 */
interface JobEventDB {
  id?: string;
  job_application_id: string;
  date: string;
  title: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Job event interface for frontend usage
 * Must match the shape in JobApplication.events
 */
interface JobEvent {
  id?: string; // Added for database records
  date: string;
  title: string;
  description?: string; // Using optional string to match JobApplication.events
}

/**
 * JobContext interface defining the contract for consumers
 */
interface JobContextType {
  jobs: JobApplication[];
  isLoading: boolean;
  addJob: (job: JobApplication) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  updateJob: (job: JobApplication) => Promise<void>;
  refreshJobs: () => Promise<void>;
}

//=============================================================================
// CONTEXT CREATION
//=============================================================================

const JobContext = createContext<JobContextType | undefined>(undefined);

/**
 * Custom hook to use the job context
 * @returns JobContextType - The job context value
 * @throws Error if used outside of JobProvider
 */
export function useJobs() {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error("useJobs must be used within a JobProvider");
  }
  return context;
}

interface JobProviderProps {
  children: ReactNode;
}

//=============================================================================
// JOB PROVIDER COMPONENT
//=============================================================================

/**
 * JobProvider component that manages job application state
 * and provides methods to interact with job data
 */
function JobProvider({ children }: JobProviderProps) {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const fetchInProgressRef = useRef<Promise<void> | null>(null);
  const lastLoadTimeRef = useRef<number>(0);

  // Add mounted ref to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Cleanup function when component unmounts
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  //=============================================================================
  // UTILITY FUNCTIONS
  //=============================================================================

  /**
   * Safe state setter that checks if component is still mounted
   * Prevents memory leaks and React warnings
   */
  const safeSetJobs = useCallback(
    (updater: React.SetStateAction<JobApplication[]>) => {
      if (isMountedRef.current) {
        setJobs(updater);
      }
    },
    []
  );

  /**
   * Safe loading state setter that checks if component is still mounted
   */
  const safeSetLoading = useCallback((value: boolean) => {
    if (isMountedRef.current) {
      setIsLoading(value);
    }
  }, []);

  /**
   * Convert a database job record to frontend format
   * Maps database field names to frontend property names
   */
  const mapJobFromDB = (
    dbJob: JobApplicationDB,
    events: JobEvent[] = []
  ): JobApplication => ({
    id: dbJob.id,
    company: dbJob.company,
    position: dbJob.position,
    location: dbJob.location || "",
    status: dbJob.status as JobApplication["status"],
    appliedDate: dbJob.applied_date || "",
    lastUpdated: dbJob.last_updated,
    companyWebsite: dbJob.company_website || "",
    salary: dbJob.salary || "",
    jobDescription: dbJob.job_description || "",
    workType: (dbJob.work_type || "On-site") as JobApplication["workType"],
    employmentType: (dbJob.employment_type ||
      "Full-time") as JobApplication["employmentType"],
    remote: dbJob.remote || false,
    events: events,
    notes: [], // To be implemented when notes table is available
    contacts: [], // To be implemented when contacts table is available
  });

  /**
   * Prepare job data for database insertion/update
   * Maps frontend property names to database field names
   */
  const prepareJobForDB = (
    job: JobApplication
  ): Omit<JobApplicationDB, "id" | "user_id"> => ({
    company: job.company,
    position: job.position,
    location: job.location || null,
    status: job.status,
    applied_date: job.appliedDate || null,
    last_updated: new Date().toISOString(),
    company_website: job.companyWebsite || null,
    salary: job.salary || null,
    job_description:
      typeof job.jobDescription === "string" ? job.jobDescription : "",
    work_type: job.workType || "On-site",
    employment_type: job.employmentType || "Full-time",
    remote: job.remote || false,
  });

  //=============================================================================
  // DATA LOADING FUNCTIONS
  //=============================================================================

  /**
   * Main function to load jobs that can be called externally
   * Implements caching, throttling, and optimistic loading
   */
  const loadJobs = async () => {
    try {
      // Avoid parallel loading requests if there's already one in progress
      if (fetchInProgressRef.current) {
        console.log(
          "Job loading already in progress, returning existing promise"
        );
        return fetchInProgressRef.current;
      }

      // Implement rate limiting to prevent too many refreshes
      const now = Date.now();
      const timeSinceLastLoad = now - lastLoadTimeRef.current;
      const MIN_REFRESH_INTERVAL = 10000; // 10 seconds

      if (timeSinceLastLoad < MIN_REFRESH_INTERVAL && jobs.length > 0) {
        console.log("Throttling refresh requests, using existing data");
        return Promise.resolve();
      }

      safeSetLoading(true);
      console.log("Loading jobs... Auth status:", !!user?.id);

      if (!user?.id) {
        // If no user, use mock data for demo purposes
        console.log("No authenticated user, loading mock data instead");
        safeSetJobs(mockJobs);
        safeSetLoading(false);
        return Promise.resolve();
      }

      // Check for cached jobs first to display immediately
      const cachedJobs = localStorage.getItem("cached_jobs");
      const cachedTimestamp = localStorage.getItem("cached_jobs_timestamp");
      const CACHE_VALID_DURATION = 5 * 60 * 1000; // 5 minutes (reduced for fresher data)

      // Generate cache key based on user ID for multi-user support
      const userCacheKey = `user_${user.id}_jobs`;
      const userCachedJobs = localStorage.getItem(userCacheKey);
      const userCachedTimestamp = localStorage.getItem(
        `${userCacheKey}_timestamp`
      );

      // Check user-specific cache first, then fallback to general cache
      const effectiveCachedJobs = userCachedJobs || cachedJobs;
      const effectiveCachedTimestamp = userCachedTimestamp || cachedTimestamp;

      // Use cached data if it exists and is recent
      if (effectiveCachedJobs && effectiveCachedTimestamp) {
        const timestamp = parseInt(effectiveCachedTimestamp);
        const isValid = Date.now() - timestamp < CACHE_VALID_DURATION;

        if (isValid) {
          try {
            const parsed = JSON.parse(effectiveCachedJobs);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log("Using cached jobs data:", parsed.length, "jobs");
              safeSetJobs(parsed);
              safeSetLoading(false);

              // Continue loading in background after a short delay
              // This prevents UI jank on initial page load
              const loadPromise = new Promise<void>((resolve) => {
                setTimeout(async () => {
                  try {
                    await fetchJobs(false);
                    resolve();
                  } catch (err) {
                    console.error("Background refresh error:", err);
                    resolve(); // Still resolve to clean up the promise
                  } finally {
                    fetchInProgressRef.current = null;
                  }
                }, 500);
              });

              fetchInProgressRef.current = loadPromise;
              return loadPromise;
            }
          } catch (e) {
            console.error("Error parsing cached jobs:", e);
            // Cache is invalid, continue with normal loading
          }
        } else {
          console.log("Cache expired, loading fresh data");
        }
      }

      // No valid cache, load directly
      const loadPromise = fetchJobs(true);
      fetchInProgressRef.current = loadPromise;

      return loadPromise.finally(() => {
        fetchInProgressRef.current = null;
      });
    } catch (error: any) {
      console.error("Error loading jobs:", error.message);
      // Fallback to mock data with a clear indicator
      toast({
        title: "Error loading jobs",
        description: "Using demo data instead. Please try again later.",
        variant: "destructive",
      });
      safeSetJobs(
        mockJobs.map((job) => ({
          ...job,
          company: `[DEMO] ${job.company}`,
        }))
      );
      safeSetLoading(false);
      return Promise.resolve();
    }
  };

  /**
   * Fetch jobs from Supabase database
   * This is the core function that performs the actual data fetching
   *
   * @param updateLoadingState Whether to update the loading state (false for background refreshes)
   */
  const fetchJobs = async (updateLoadingState = true) => {
    if (!user?.id) return;

    try {
      // Record the fetch time for throttling
      lastLoadTimeRef.current = Date.now();

      // First, get the total count of jobs
      const { count: totalCount, error: countError } = await supabase
        .from("job_applications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (countError) {
        throw new Error(`Error counting jobs: ${countError.message}`);
      }

      // Initial fetch of jobs - limited to first 50 for performance
      const { data: jobsData, error: jobsError } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("last_updated", { ascending: false })
        .limit(50);

      if (jobsError) {
        throw new Error(`Error fetching jobs: ${jobsError.message}`);
      }

      // Fetch all job IDs for the related data queries
      const jobIds = jobsData.map((job) => job.id);

      // Fetch events for the jobs
      let eventsData: any[] = [];
      let eventsError = null;

      try {
        const result = await supabase
          .from("job_events")
          .select("*")
          .in("job_application_id", jobIds)
          .order("date", { ascending: false });

        eventsData = result.data || [];
        eventsError = result.error;

        if (
          eventsError &&
          eventsError.message?.includes(
            'relation "public.job_events" does not exist'
          )
        ) {
          // Try fallback to job_application_events if job_events doesn't exist
          console.log(
            "Trying fallback events table due to missing job_events table"
          );
          const fallbackResult = await supabase
            .from("job_application_events")
            .select("*")
            .in("job_application_id", jobIds)
            .order("date", { ascending: false });

          if (!fallbackResult.error) {
            eventsData = fallbackResult.data || [];
            eventsError = null;
          } else {
            console.error(
              "Error fetching from fallback events table:",
              fallbackResult.error
            );
          }
        }
      } catch (err) {
        console.error("Error fetching job events:", err);
        eventsData = [];
      }

      if (eventsError) {
        console.error("Error fetching job events:", eventsError);
        // Continue without events rather than failing completely
      }

      // Group events by job ID for easier access
      const eventsById: Record<string, JobEvent[]> = {};

      if (Array.isArray(eventsData)) {
        eventsData.forEach((event) => {
          if (event && event.job_application_id) {
            const jobId = event.job_application_id;
            if (!eventsById[jobId]) {
              eventsById[jobId] = [];
            }
            eventsById[jobId].push({
              id: event.id,
              date: event.date,
              title: event.title,
              description: event.description,
            });
          }
        });
      }

      // Map database jobs to frontend format
      const mappedJobs = jobsData.map((dbJob) => {
        const jobEvents = eventsById[dbJob.id] || [];
        return mapJobFromDB(dbJob, jobEvents);
      });

      // Update state with the fetched jobs
      safeSetJobs(mappedJobs);

      if (updateLoadingState) {
        safeSetLoading(false);
      }

      // Cache the fetched jobs for faster loading next time
      try {
        const userCacheKey = `user_${user.id}_jobs`;
        localStorage.setItem(userCacheKey, JSON.stringify(mappedJobs));
        localStorage.setItem(
          `${userCacheKey}_timestamp`,
          Date.now().toString()
        );

        // Also update the general cache as fallback
        localStorage.setItem("cached_jobs", JSON.stringify(mappedJobs));
        localStorage.setItem("cached_jobs_timestamp", Date.now().toString());
      } catch (e) {
        console.error("Error caching jobs:", e);
        // Continue without caching - this is non-critical
      }

      // If there are more jobs to fetch (beyond the initial 50), get them in the background
      if ((totalCount || 0) > 50) {
        fetchRemainingJobs(50, totalCount || 0, mappedJobs).catch((err) => {
          console.error("Error fetching remaining jobs:", err);
          // This is a background operation, so we don't need to update loading state
        });
      }

      // Prefetch job details in the background for better UX
      prefetchJobDetails(jobIds.slice(0, 10)).catch((err) => {
        console.error("Error prefetching job details:", err);
        // Non-critical background operation
      });
    } catch (error: any) {
      console.error("Error in fetchJobs:", error);
      if (updateLoadingState) {
        safeSetLoading(false);
      }
      toast({
        title: "Error loading jobs",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    }
  };

  /**
   * Fetch remaining jobs beyond the initial limit
   * This is used for pagination when there are many jobs
   *
   * @param offset The number of jobs already fetched
   * @param totalCount The total number of jobs to fetch
   * @param existingJobs The jobs already fetched
   */
  const fetchRemainingJobs = async (
    offset: number,
    totalCount: number,
    existingJobs: JobApplication[]
  ) => {
    if (!user?.id) return;

    try {
      // Calculate how many more batches we need
      const BATCH_SIZE = 50;
      const batchesNeeded = Math.ceil((totalCount - offset) / BATCH_SIZE);

      const allNewJobs: JobApplication[] = [];

      // Fetch each batch sequentially
      for (let i = 0; i < batchesNeeded; i++) {
        const currentOffset = offset + i * BATCH_SIZE;

        const { data: jobsData, error: jobsError } = await supabase
          .from("job_applications")
          .select("*")
          .eq("user_id", user.id)
          .order("last_updated", { ascending: false })
          .range(currentOffset, currentOffset + BATCH_SIZE - 1);

        if (jobsError) {
          throw new Error(`Error fetching jobs batch: ${jobsError.message}`);
        }

        if (!jobsData.length) break; // No more data

        // Get IDs for related data
        const jobIds = jobsData.map((job) => job.id);

        // Fetch events for these jobs
        const { data: eventsData, error: eventsError } = await supabase
          .from("job_events")
          .select("*")
          .in("job_application_id", jobIds)
          .order("date", { ascending: false });

        if (eventsError) {
          console.error("Error fetching job events for batch:", eventsError);
          // Continue without events
        }

        // Group events by job ID
        const eventsById: Record<string, JobEvent[]> = {};
        eventsData?.forEach((event) => {
          const jobId = event.job_application_id;
          if (!eventsById[jobId]) {
            eventsById[jobId] = [];
          }
          eventsById[jobId].push({
            id: event.id,
            date: event.date,
            title: event.title,
            description: event.description,
          });
        });

        // Map batch jobs to frontend format
        const mappedBatchJobs = jobsData.map((dbJob) => {
          const jobEvents = eventsById[dbJob.id] || [];
          return mapJobFromDB(dbJob, jobEvents);
        });

        allNewJobs.push(...mappedBatchJobs);
      }

      // Combine existing and new jobs, ensuring no duplicates
      const existingIds = new Set(existingJobs.map((job) => job.id));
      const uniqueNewJobs = allNewJobs.filter(
        (job) => !existingIds.has(job.id)
      );

      if (uniqueNewJobs.length > 0) {
        safeSetJobs((prev) => [...prev, ...uniqueNewJobs]);

        // Update the cache with the complete job list
        try {
          const allJobs = [...existingJobs, ...uniqueNewJobs];
          const userCacheKey = `user_${user.id}_jobs`;
          localStorage.setItem(userCacheKey, JSON.stringify(allJobs));
          localStorage.setItem(
            `${userCacheKey}_timestamp`,
            Date.now().toString()
          );
          localStorage.setItem("cached_jobs", JSON.stringify(allJobs));
          localStorage.setItem("cached_jobs_timestamp", Date.now().toString());
        } catch (e) {
          console.error("Error updating cache with remaining jobs:", e);
        }
      }
    } catch (error: any) {
      console.error("Error fetching remaining jobs:", error);
      // Don't update loading state or show toast as this is a background operation
    }
  };

  /**
   * Prefetch additional job details for better UX
   * This loads data that might be needed soon but isn't required immediately
   *
   * @param jobIds The IDs of jobs to prefetch details for
   */
  const prefetchJobDetails = async (jobIds: string[]) => {
    if (!jobIds.length) return;

    try {
      // This function would fetch additional related data for jobs
      // For example, contacts, detailed notes, etc.
      // Currently this is a placeholder for future implementation
      // Example implementation (commented out until tables exist):
      /*
      // Fetch job contacts
      const { data: contactsData } = await supabase
        .from('job_contacts')
        .select('*')
        .in('job_application_id', jobIds);
      
      // Fetch detailed notes
      const { data: notesData } = await supabase
        .from('job_notes')
        .select('*')
        .in('job_application_id', jobIds);
      
      // Update jobs with this additional data
      if (contactsData?.length || notesData?.length) {
        setJobs(prevJobs => {
          return prevJobs.map(job => {
            const jobContacts = contactsData?.filter(c => c.job_application_id === job.id) || [];
            const jobNotes = notesData?.filter(n => n.job_application_id === job.id) || [];
            
            return {
              ...job,
              contacts: jobContacts,
              notes: jobNotes
            };
          });
        });
      }
      */
    } catch (error) {
      console.error("Error prefetching job details:", error);
      // This is a background operation so we don't need to handle the error visibly
    }
  };

  //=============================================================================
  // PUBLIC API METHODS
  //=============================================================================

  /**
   * Refresh all jobs data
   * Publicly exposed method to force a complete refresh
   */
  const refreshJobs = async () => {
    // Simply delegate to loadJobs which handles all the logic
    return loadJobs();
  };

  /**
   * Add a new job application
   *
   * @param job The job to add
   */
  const addJob = async (job: JobApplication): Promise<void> => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to add jobs",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate a new ID if not provided
      const jobToAdd = {
        ...job,
        id: job.id || uuidv4(),
        lastUpdated: new Date().toISOString(),
      };

      // Optimistically update the UI
      safeSetJobs((prev) => [jobToAdd, ...prev]);

      // Prepare job data for database
      const jobData = prepareJobForDB(jobToAdd);

      // Insert job into database
      const { data: newJob, error } = await supabase
        .from("job_applications")
        .insert([
          {
            ...jobData,
            id: jobToAdd.id,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add job: ${error.message}`);
      }

      // Add any events if specified
      if (jobToAdd.events && jobToAdd.events.length > 0) {
        const events = jobToAdd.events.map((event) => ({
          job_application_id: jobToAdd.id,
          date: event.date,
          title: event.title,
          description: event.description || null,
        }));

        const { error: eventsError } = await supabase
          .from("job_events")
          .insert(events);

        if (eventsError) {
          console.error("Error adding job events:", eventsError);
          // Continue despite event error
        }
      }

      // Update cache
      updateJobsCache();

      toast({
        title: "Job added",
        description: `${jobToAdd.position} at ${jobToAdd.company} added successfully`,
      });
    } catch (error: any) {
      console.error("Error adding job:", error);

      // Revert optimistic update on error
      safeSetJobs((prev) => prev.filter((prevJob) => prevJob.id !== job.id));

      toast({
        title: "Error adding job",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  /**
   * Delete a job application
   *
   * @param id The ID of the job to delete
   */
  const deleteJob = async (id: string): Promise<void> => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete jobs",
        variant: "destructive",
      });
      return;
    }

    try {
      // Store a copy of the job before deletion for recovery
      const jobToDelete = jobs.find((job) => job.id === id);
      if (!jobToDelete) {
        throw new Error("Job not found");
      }

      // Optimistically update UI
      safeSetJobs((prev) => prev.filter((job) => job.id !== id));

      // Delete job from database
      const { error } = await supabase
        .from("job_applications")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id); // Ensure we only delete user's own jobs

      if (error) {
        throw new Error(`Failed to delete job: ${error.message}`);
      }

      // Update cache
      updateJobsCache();

      toast({
        title: "Job deleted",
        description: `${jobToDelete.position} at ${jobToDelete.company} deleted`,
      });
    } catch (error: any) {
      console.error("Error deleting job:", error);

      // Revert optimistic update on error
      if (jobs.find((job) => job.id === id) === undefined) {
        await loadJobs(); // Reload jobs if the one we tried to delete is no longer in state
      }

      toast({
        title: "Error deleting job",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  /**
   * Update an existing job application
   *
   * @param updatedJob The job with updated data
   */
  const updateJob = async (updatedJob: JobApplication): Promise<void> => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to update jobs",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the current job data for comparison
      const currentJob = jobs.find((job) => job.id === updatedJob.id);
      if (!currentJob) {
        throw new Error("Job not found");
      }

      // Apply last updated timestamp
      const jobWithTimestamp = {
        ...updatedJob,
        lastUpdated: new Date().toISOString(),
      };

      // Optimistically update UI
      safeSetJobs((prev) =>
        prev.map((job) => (job.id === updatedJob.id ? jobWithTimestamp : job))
      );

      // Prepare job data for database
      const jobData = prepareJobForDB(jobWithTimestamp);

      // Update job in database
      const { error } = await supabase
        .from("job_applications")
        .update(jobData)
        .eq("id", updatedJob.id)
        .eq("user_id", user.id); // Ensure we only update user's own jobs

      if (error) {
        throw new Error(`Failed to update job: ${error.message}`);
      }

      // Check for new events to add
      if (updatedJob.events) {
        // For events coming from the database, we may have IDs
        // For new events added by the user, we won't have IDs yet
        const existingEventIds = new Set(
          currentJob.events
            .filter((event) => "id" in event && event.id !== undefined)
            .map((event) => (event as JobEvent & { id: string }).id)
        );

        const newEvents = updatedJob.events.filter(
          (event) =>
            !("id" in event) ||
            !existingEventIds.has((event as JobEvent & { id: string }).id)
        );

        if (newEvents.length > 0) {
          const eventsToInsert = newEvents.map((event) => ({
            job_application_id: updatedJob.id,
            date: event.date,
            title: event.title,
            description: event.description || null,
          }));

          const { error: eventsError } = await supabase
            .from("job_events")
            .insert(eventsToInsert);

          if (eventsError) {
            console.error("Error adding new job events:", eventsError);
            // Continue despite event error
          }
        }
      }

      // Update cache
      updateJobsCache();

      toast({
        title: "Job updated",
        description: `${updatedJob.position} at ${updatedJob.company} updated`,
      });
    } catch (error: any) {
      console.error("Error updating job:", error);

      // Revert optimistic update on error
      await loadJobs();

      toast({
        title: "Error updating job",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  /**
   * Update the jobs cache with the current jobs state
   * Used internally after state changes
   */
  const updateJobsCache = useCallback(() => {
    if (!user?.id) return;

    try {
      const userCacheKey = `user_${user.id}_jobs`;
      localStorage.setItem(userCacheKey, JSON.stringify(jobs));
      localStorage.setItem(`${userCacheKey}_timestamp`, Date.now().toString());

      // Also update general cache as fallback
      localStorage.setItem("cached_jobs", JSON.stringify(jobs));
      localStorage.setItem("cached_jobs_timestamp", Date.now().toString());
    } catch (e) {
      console.error("Error updating jobs cache:", e);
      // Non-critical error, continue without caching
    }
  }, [jobs, user?.id]);

  //=============================================================================
  // EFFECTS
  //=============================================================================

  // Load jobs on mount and when user changes
  useEffect(() => {
    loadJobs();
  }, [user?.id]);

  // Expose the context value
  const value: JobContextType = {
    jobs,
    isLoading,
    addJob,
    deleteJob,
    updateJob,
    refreshJobs,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
}

export default JobProvider;
