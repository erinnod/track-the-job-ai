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
import { useToast } from "@/hooks/use-toast";
import {
  createApplicationNotification,
  createStatusChangeNotification,
  createInterviewNotification,
} from "@/utils/notificationUtils";

interface JobContextType {
  jobs: JobApplication[];
  isLoading: boolean;
  addJob: (job: JobApplication) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  updateJob: (job: JobApplication) => Promise<void>;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const useJobs = () => {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error("useJobs must be used within a JobProvider");
  }
  return context;
};

interface JobProviderProps {
  children: ReactNode;
}

export const JobProvider = ({ children }: JobProviderProps) => {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Add mounted ref to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Add user ID ref to prevent duplicate fetches
  const userIdRef = useRef<string | null>(null);

  // Add initial load flag to prevent flashing on first render
  const initialLoadRef = useRef(true);

  // Cleanup function when component unmounts
  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;

    // Cleanup function to prevent memory leaks
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safe state setter that checks if component is still mounted
  const safeSetJobs = useCallback((updater: any) => {
    if (isMountedRef.current) {
      setJobs(updater);
    }
  }, []);

  const safeSetLoading = useCallback((value: boolean) => {
    if (isMountedRef.current) {
      setIsLoading(value);
    }
  }, []);

  // Set initial load to false after a brief period
  useEffect(() => {
    const timeout = setTimeout(() => {
      initialLoadRef.current = false;
      if (isMountedRef.current) {
        safeSetLoading(false);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [safeSetLoading]);

  // Load jobs from Supabase when the component mounts or user changes
  useEffect(() => {
    // Check if we've already loaded jobs for this user
    if (user?.id === userIdRef.current && jobs.length > 0) {
      return;
    }

    // Update the user ID reference
    userIdRef.current = user?.id || null;

    // Always stop loading after a maximum time to prevent eternal loading
    const loadingTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        safeSetLoading(false);
      }
    }, 8000);

    const fetchJobs = async () => {
      if (!user) {
        safeSetJobs([]);
        safeSetLoading(false);
        clearTimeout(loadingTimeout);
        return;
      }

      // Don't show loading if we're refreshing and already have jobs
      if (!initialLoadRef.current && jobs.length > 0) {
        // Use a less intrusive loading state update
        safeSetLoading(true);
      } else {
        safeSetLoading(true);
      }

      try {
        // Get jobs for the current user
        const { data: jobsData, error: jobsError } = await supabase
          .from("job_applications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (jobsError) {
          console.error("Error fetching jobs:", jobsError);
          if (isMountedRef.current) {
            toast({
              title: "Error loading jobs",
              description: "There was a problem loading your job applications.",
              variant: "destructive",
            });
          }

          // Fallback to mock data
          safeSetJobs(mockJobs);
          safeSetLoading(false);
          clearTimeout(loadingTimeout);
          return;
        }

        // Get all related data for the jobs in parallel for better performance
        const jobIds = jobsData.map((job) => job.id);

        if (jobIds.length === 0) {
          // No jobs yet, set empty array
          safeSetJobs([]);
          safeSetLoading(false);
          clearTimeout(loadingTimeout);
          return;
        }

        // Use Promise.all for parallel fetching
        const [contactsResult, notesResult, eventsResult] = await Promise.all([
          // Get contacts
          supabase
            .from("job_application_contacts")
            .select("*")
            .in("job_application_id", jobIds),

          // Get notes
          supabase
            .from("job_application_notes")
            .select("*")
            .in("job_application_id", jobIds),

          // Get events
          supabase
            .from("job_application_events")
            .select("*")
            .in("job_application_id", jobIds),
        ]);

        const contactsData = contactsResult.error ? [] : contactsResult.data;
        const notesData = notesResult.error ? [] : notesResult.data;
        const eventsData = eventsResult.error ? [] : eventsResult.data;

        if (contactsResult.error) {
          console.error("Error fetching contacts:", contactsResult.error);
        }

        if (notesResult.error) {
          console.error("Error fetching notes:", notesResult.error);
        }

        if (eventsResult.error) {
          console.error("Error fetching events:", eventsResult.error);
        }

        // Map snake_case field names from Supabase to camelCase field names used in the app
        // And combine with the related data
        const mappedJobs = jobsData.map((job: any) => {
          // Get this job's contacts, notes, and events
          const jobContacts = contactsData
            ? contactsData
                .filter((contact) => contact.job_application_id === job.id)
                .map((contact) => ({
                  name: contact.name,
                  email: contact.email,
                  phone: contact.phone,
                  position: contact.position,
                }))
            : [];

          const jobNotes = notesData
            ? notesData
                .filter((note) => note.job_application_id === job.id)
                .map((note) => note.content)
            : [];

          const jobEvents = eventsData
            ? eventsData
                .filter((event) => event.job_application_id === job.id)
                .map((event) => ({
                  title: event.title,
                  description: event.description,
                  date: event.date,
                }))
            : [];

          return {
            id: job.id,
            company: job.company,
            position: job.position,
            location: job.location,
            status: job.status,
            appliedDate: job.applied_date,
            lastUpdated: job.last_updated,
            companyWebsite: job.company_website,
            salary: job.salary,
            jobDescription: job.job_description,
            type: job.type,
            remote: job.remote,
            workType: job.work_type || "On-site",
            employmentType: job.employment_type || "Full-time",
            // Add related data
            contacts: jobContacts,
            notes: jobNotes,
            events: jobEvents,
          };
        });

        if (isMountedRef.current) {
          safeSetJobs(mappedJobs || []);
        }
      } catch (error) {
        console.error("Exception fetching jobs:", error);
        // Fallback to mock data
        if (isMountedRef.current) {
          safeSetJobs(mockJobs);
        }
      } finally {
        // Add slight delay before hiding loading indicator to prevent flash
        setTimeout(() => {
          if (isMountedRef.current) {
            safeSetLoading(false);
          }
        }, 100);
        clearTimeout(loadingTimeout);
      }
    };

    fetchJobs();

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [user, toast, jobs.length, safeSetJobs, safeSetLoading]);

  // Add a new job - optimized with memoization and safe state updates
  const addJob = useCallback(
    async (job: JobApplication) => {
      if (!user) {
        if (isMountedRef.current) {
          toast({
            title: "Authentication required",
            description: "Please sign in to save jobs.",
            variant: "destructive",
          });
        }
        return;
      }

      try {
        // Format dates properly for PostgreSQL
        const formattedAppliedDate = job.appliedDate
          ? new Date(job.appliedDate).toISOString()
          : null;

        const formattedLastUpdated = job.lastUpdated
          ? new Date(job.lastUpdated).toISOString()
          : new Date().toISOString();

        // Map camelCase fields to snake_case for Supabase - main job record
        const jobWithUserId = {
          ...job,
          user_id: user.id,
          applied_date: formattedAppliedDate,
          last_updated: formattedLastUpdated,
          company_website: job.companyWebsite,
          job_description: job.jobDescription,
          work_type: job.workType || "On-site",
          employment_type: job.employmentType || "Full-time",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Remove the camelCase fields that were converted to snake_case
        // Also remove the related tables data that will be inserted separately
        delete (jobWithUserId as any).appliedDate;
        delete (jobWithUserId as any).lastUpdated;
        delete (jobWithUserId as any).companyWebsite;
        delete (jobWithUserId as any).jobDescription;
        delete (jobWithUserId as any).workType;
        delete (jobWithUserId as any).employmentType;
        delete (jobWithUserId as any).contacts;
        delete (jobWithUserId as any).notes;
        delete (jobWithUserId as any).events;

        // Insert the main job application
        const { data, error } = await supabase
          .from("job_applications")
          .insert(jobWithUserId)
          .select()
          .single();

        if (error) {
          console.error("Error adding job:", error);
          throw error;
        }

        // Now insert the related data if it exists
        const jobId = data.id;

        // Insert contacts if any
        if (job.contacts && job.contacts.length > 0) {
          const contactsToInsert = job.contacts.map((contact) => ({
            job_application_id: jobId,
            name: contact.name,
            email: contact.email,
            phone: contact.phone || null,
            position: contact.position || null,
          }));

          const { error: contactsError } = await supabase
            .from("job_application_contacts")
            .insert(contactsToInsert);

          if (contactsError) {
            console.error("Error adding contacts:", contactsError);
          }
        }

        // Insert notes if any
        if (job.notes && job.notes.length > 0) {
          const notesToInsert = job.notes.map((note) => ({
            job_application_id: jobId,
            content: note,
            created_at: new Date().toISOString(),
          }));

          const { error: notesError } = await supabase
            .from("job_application_notes")
            .insert(notesToInsert);

          if (notesError) {
            console.error("Error adding notes:", notesError);
          }
        }

        // Insert events if any
        if (job.events && job.events.length > 0) {
          const eventsToInsert = job.events.map((event) => ({
            job_application_id: jobId,
            title: event.title,
            description: event.description || null,
            date: new Date(event.date).toISOString(),
            created_at: new Date().toISOString(),
          }));

          const { error: eventsError } = await supabase
            .from("job_application_events")
            .insert(eventsToInsert);

          if (eventsError) {
            console.error("Error adding events:", eventsError);
          }
        }

        // Construct the complete job with relations for the local state
        const completeJob: JobApplication = {
          ...data,
          appliedDate: data.applied_date,
          lastUpdated: data.last_updated,
          companyWebsite: data.company_website,
          jobDescription: data.job_description,
          contacts: job.contacts || [],
          notes: job.notes || [],
          events: job.events || [],
        };

        setJobs((prevJobs) => [completeJob, ...prevJobs]);

        // Create appropriate notifications based on job status
        try {
          if (job.status === "applied") {
            await createApplicationNotification(
              user.id,
              job.company,
              job.position
            );
          } else if (
            job.status === "interview" &&
            job.events &&
            job.events.length > 0
          ) {
            // Find the first interview event
            const interviewEvent = job.events.find(
              (event) =>
                event.title && event.title.toLowerCase().includes("interview")
            );

            if (interviewEvent && interviewEvent.date) {
              await createInterviewNotification(
                user.id,
                job.company,
                job.position,
                new Date(interviewEvent.date)
              );
            }
          }
        } catch (notificationError) {
          // Log the error but allow the job creation to complete
          console.error("Error creating notifications:", notificationError);
        }
      } catch (error: any) {
        console.error("Exception adding job:", error);
        toast({
          title: "Error adding job",
          description: error.message || "There was a problem adding this job.",
          variant: "destructive",
        });
      }
    },
    [user, toast]
  );

  // Update an existing job
  const updateJob = useCallback(
    async (job: JobApplication) => {
      if (!user) {
        if (isMountedRef.current) {
          toast({
            title: "Authentication required",
            description: "Please sign in to update jobs.",
            variant: "destructive",
          });
        }
        return;
      }

      try {
        safeSetLoading(true);

        // Convert from camelCase to snake_case for Supabase
        const jobData = {
          company: job.company,
          position: job.position,
          location: job.location,
          status: job.status,
          applied_date: job.appliedDate
            ? new Date(job.appliedDate).toISOString()
            : null,
          last_updated: new Date().toISOString(),
          company_website: job.companyWebsite,
          salary: job.salary,
          job_description: job.jobDescription,
          type: job.type,
          remote: job.remote,
          work_type: job.workType,
          employment_type: job.employmentType,
          updated_at: new Date().toISOString(),
        };

        // Update the job in Supabase
        const { error } = await supabase
          .from("job_applications")
          .update(jobData)
          .eq("id", job.id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error updating job:", error);
          if (isMountedRef.current) {
            toast({
              title: "Error updating job",
              description: "There was a problem updating your job application.",
              variant: "destructive",
            });
          }
          return;
        }

        // Update related data - first delete existing data then insert new data

        // Handle contacts
        if (job.contacts) {
          // First delete existing contacts
          const { error: deleteContactsError } = await supabase
            .from("job_application_contacts")
            .delete()
            .eq("job_application_id", job.id);

          if (deleteContactsError) {
            console.error("Error deleting contacts:", deleteContactsError);
          }

          // Insert new contacts
          if (job.contacts.length > 0) {
            const contactsToInsert = job.contacts.map((contact) => ({
              job_application_id: job.id,
              name: contact.name,
              email: contact.email,
              phone: contact.phone || null,
              position: contact.position || null,
            }));

            const { error: contactsError } = await supabase
              .from("job_application_contacts")
              .insert(contactsToInsert);

            if (contactsError) {
              console.error("Error updating contacts:", contactsError);
            }
          }
        }

        // Handle notes
        if (job.notes) {
          // First delete existing notes
          const { error: deleteNotesError } = await supabase
            .from("job_application_notes")
            .delete()
            .eq("job_application_id", job.id);

          if (deleteNotesError) {
            console.error("Error deleting notes:", deleteNotesError);
          }

          // Insert new notes
          if (job.notes.length > 0) {
            const notesToInsert = job.notes.map((note) => ({
              job_application_id: job.id,
              content: note,
              created_at: new Date().toISOString(),
            }));

            const { error: notesError } = await supabase
              .from("job_application_notes")
              .insert(notesToInsert);

            if (notesError) {
              console.error("Error updating notes:", notesError);
            }
          }
        }

        // Handle events
        if (job.events) {
          // First delete existing events
          const { error: deleteEventsError } = await supabase
            .from("job_application_events")
            .delete()
            .eq("job_application_id", job.id);

          if (deleteEventsError) {
            console.error("Error deleting events:", deleteEventsError);
          }

          // Insert new events
          if (job.events.length > 0) {
            const eventsToInsert = job.events.map((event) => ({
              job_application_id: job.id,
              title: event.title,
              description: event.description || null,
              date: event.date ? new Date(event.date).toISOString() : null,
              created_at: new Date().toISOString(),
            }));

            const { error: eventsError } = await supabase
              .from("job_application_events")
              .insert(eventsToInsert);

            if (eventsError) {
              console.error("Error updating events:", eventsError);
            }
          }
        }

        // Update the job in the state
        safeSetJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));

        if (isMountedRef.current) {
          toast({
            title: "Job updated",
            description: "Your job application has been updated.",
          });
        }
      } catch (error) {
        console.error("Exception updating job:", error);
        if (isMountedRef.current) {
          toast({
            title: "Error updating job",
            description: "There was a problem updating your job application.",
            variant: "destructive",
          });
        }
      } finally {
        safeSetLoading(false);
      }
    },
    [user, toast, safeSetJobs, safeSetLoading]
  );

  // Delete a job
  const deleteJob = useCallback(
    async (id: string) => {
      if (!user) {
        if (isMountedRef.current) {
          toast({
            title: "Authentication required",
            description: "Please sign in to delete jobs.",
            variant: "destructive",
          });
        }
        return;
      }

      try {
        safeSetLoading(true);

        // Delete the job from Supabase
        const { error } = await supabase
          .from("job_applications")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error deleting job:", error);
          if (isMountedRef.current) {
            toast({
              title: "Error deleting job",
              description: "There was a problem deleting your job application.",
              variant: "destructive",
            });
          }
          return;
        }

        // Delete the job from the state
        safeSetJobs((prev) => prev.filter((job) => job.id !== id));

        if (isMountedRef.current) {
          toast({
            title: "Job deleted",
            description: "Your job application has been deleted.",
          });
        }
      } catch (error) {
        console.error("Exception deleting job:", error);
        if (isMountedRef.current) {
          toast({
            title: "Error deleting job",
            description: "There was a problem deleting your job application.",
            variant: "destructive",
          });
        }
      } finally {
        safeSetLoading(false);
      }
    },
    [user, toast, safeSetJobs, safeSetLoading]
  );

  const value = {
    jobs,
    isLoading,
    addJob,
    deleteJob,
    updateJob,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};
