import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
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

  // Load jobs from Supabase when the component mounts or user changes
  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) {
        setJobs([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Get jobs for the current user
        const { data: jobsData, error: jobsError } = await supabase
          .from("job_applications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (jobsError) {
          console.error("Error fetching jobs:", jobsError);
          toast({
            title: "Error loading jobs",
            description: "There was a problem loading your job applications.",
            variant: "destructive",
          });

          // Fallback to mock data
          setJobs(mockJobs);
          return;
        }

        // Get all related data for the jobs
        const jobIds = jobsData.map((job) => job.id);

        // Get contacts
        const { data: contactsData, error: contactsError } = await supabase
          .from("job_application_contacts")
          .select("*")
          .in("job_id", jobIds)
          .eq("user_id", user.id);

        if (contactsError) {
          console.error("Error fetching contacts:", contactsError);
        }

        // Get notes
        const { data: notesData, error: notesError } = await supabase
          .from("job_application_notes")
          .select("*")
          .in("job_id", jobIds)
          .eq("user_id", user.id);

        if (notesError) {
          console.error("Error fetching notes:", notesError);
        }

        // Get events
        const { data: eventsData, error: eventsError } = await supabase
          .from("job_application_events")
          .select("*")
          .in("job_id", jobIds)
          .eq("user_id", user.id);

        if (eventsError) {
          console.error("Error fetching events:", eventsError);
        }

        // Map snake_case field names from Supabase to camelCase field names used in the app
        // And combine with the related data
        const mappedJobs = jobsData.map((job: any) => {
          // Get this job's contacts, notes, and events
          const jobContacts = contactsData
            ? contactsData
                .filter((contact) => contact.job_id === job.id)
                .map((contact) => ({
                  name: contact.name,
                  email: contact.email,
                  phone: contact.phone,
                  position: contact.position,
                }))
            : [];

          const jobNotes = notesData
            ? notesData
                .filter((note) => note.job_id === job.id)
                .map((note) => note.content)
            : [];

          const jobEvents = eventsData
            ? eventsData
                .filter((event) => event.job_id === job.id)
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

        setJobs(mappedJobs || []);
      } catch (error) {
        console.error("Exception fetching jobs:", error);
        // Fallback to mock data
        setJobs(mockJobs);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [user, toast]);

  // Add a new job
  const addJob = async (job: JobApplication) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save jobs.",
        variant: "destructive",
      });
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
          job_id: jobId,
          user_id: user.id,
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
          job_id: jobId,
          user_id: user.id,
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
          job_id: jobId,
          user_id: user.id,
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

      // Create a notification for the new job application
      if (job.status === "applied") {
        await createApplicationNotification(user.id, job.company, job.position);
      }

      // If the job already has an interview status, create an interview notification
      if (job.status === "interview" && job.events && job.events.length > 0) {
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
    } catch (error: any) {
      console.error("Exception adding job:", error);
      toast({
        title: "Error adding job",
        description: error.message || "There was a problem adding this job.",
        variant: "destructive",
      });
    }
  };

  // Update an existing job
  const updateJob = async (updatedJob: JobApplication) => {
    if (!user) return;

    try {
      // Get the current job to check for status changes
      const currentJob = jobs.find((job) => job.id === updatedJob.id);
      const statusChanged =
        currentJob && currentJob.status !== updatedJob.status;

      // Format dates properly for PostgreSQL
      const formattedAppliedDate = updatedJob.appliedDate
        ? new Date(updatedJob.appliedDate).toISOString()
        : null;

      // Always update the lastUpdated field
      const formattedLastUpdated = new Date().toISOString();

      // Map camelCase fields to snake_case for Supabase
      const jobForUpdate = {
        ...updatedJob,
        applied_date: formattedAppliedDate,
        last_updated: formattedLastUpdated,
        company_website: updatedJob.companyWebsite,
        job_description: updatedJob.jobDescription,
        work_type: updatedJob.workType || "On-site",
        employment_type: updatedJob.employmentType || "Full-time",
        updated_at: new Date().toISOString(),
      };

      // Remove the camelCase fields and related data fields
      delete (jobForUpdate as any).appliedDate;
      delete (jobForUpdate as any).lastUpdated;
      delete (jobForUpdate as any).companyWebsite;
      delete (jobForUpdate as any).jobDescription;
      delete (jobForUpdate as any).workType;
      delete (jobForUpdate as any).employmentType;
      delete (jobForUpdate as any).contacts;
      delete (jobForUpdate as any).notes;
      delete (jobForUpdate as any).events;

      // Update the main job record
      const { error } = await supabase
        .from("job_applications")
        .update(jobForUpdate)
        .eq("id", updatedJob.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating job:", error);
        throw error;
      }

      // Handle the related data - first delete existing records

      // Delete existing contacts
      const { error: contactsDeleteError } = await supabase
        .from("job_application_contacts")
        .delete()
        .eq("job_id", updatedJob.id)
        .eq("user_id", user.id);

      if (contactsDeleteError) {
        console.error("Error deleting existing contacts:", contactsDeleteError);
      }

      // Delete existing notes
      const { error: notesDeleteError } = await supabase
        .from("job_application_notes")
        .delete()
        .eq("job_id", updatedJob.id)
        .eq("user_id", user.id);

      if (notesDeleteError) {
        console.error("Error deleting existing notes:", notesDeleteError);
      }

      // Delete existing events
      const { error: eventsDeleteError } = await supabase
        .from("job_application_events")
        .delete()
        .eq("job_id", updatedJob.id)
        .eq("user_id", user.id);

      if (eventsDeleteError) {
        console.error("Error deleting existing events:", eventsDeleteError);
      }

      // Now insert the updated related data

      // Insert updated contacts if any
      if (updatedJob.contacts && updatedJob.contacts.length > 0) {
        const contactsToInsert = updatedJob.contacts.map((contact) => ({
          job_id: updatedJob.id,
          user_id: user.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone || null,
          position: contact.position || null,
        }));

        const { error: contactsError } = await supabase
          .from("job_application_contacts")
          .insert(contactsToInsert);

        if (contactsError) {
          console.error("Error adding updated contacts:", contactsError);
        }
      }

      // Insert updated notes if any
      if (updatedJob.notes && updatedJob.notes.length > 0) {
        const notesToInsert = updatedJob.notes.map((note) => ({
          job_id: updatedJob.id,
          user_id: user.id,
          content: note,
          created_at: new Date().toISOString(),
        }));

        const { error: notesError } = await supabase
          .from("job_application_notes")
          .insert(notesToInsert);

        if (notesError) {
          console.error("Error adding updated notes:", notesError);
        }
      }

      // Insert updated events if any
      if (updatedJob.events && updatedJob.events.length > 0) {
        const eventsToInsert = updatedJob.events.map((event) => ({
          job_id: updatedJob.id,
          user_id: user.id,
          title: event.title,
          description: event.description || null,
          date: new Date(event.date).toISOString(),
          created_at: new Date().toISOString(),
        }));

        const { error: eventsError } = await supabase
          .from("job_application_events")
          .insert(eventsToInsert);

        if (eventsError) {
          console.error("Error adding updated events:", eventsError);
        }
      }

      // Create a notification if the status has changed
      if (statusChanged) {
        await createStatusChangeNotification(
          user.id,
          updatedJob.company,
          updatedJob.position,
          updatedJob.status
        );

        // If changed to interview status and there's an interview event, create an interview notification
        if (
          updatedJob.status === "interview" &&
          updatedJob.events &&
          updatedJob.events.length > 0
        ) {
          // Find the first interview event
          const interviewEvent = updatedJob.events.find((event) =>
            event.title.toLowerCase().includes("interview")
          );

          if (interviewEvent && interviewEvent.date) {
            await createInterviewNotification(
              user.id,
              updatedJob.company,
              updatedJob.position,
              new Date(interviewEvent.date)
            );
          }
        }
      }

      // Update local state
      setJobs((prevJobs) =>
        prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
      );
    } catch (error: any) {
      console.error("Exception updating job:", error);
      toast({
        title: "Error updating job",
        description: error.message || "Could not update the job application.",
        variant: "destructive",
      });
    }
  };

  // Delete a job
  const deleteJob = async (id: string) => {
    if (!user) return;

    try {
      // First delete all related records

      // Delete contacts
      const { error: contactsDeleteError } = await supabase
        .from("job_application_contacts")
        .delete()
        .eq("job_id", id)
        .eq("user_id", user.id);

      if (contactsDeleteError) {
        console.error("Error deleting contacts:", contactsDeleteError);
      }

      // Delete notes
      const { error: notesDeleteError } = await supabase
        .from("job_application_notes")
        .delete()
        .eq("job_id", id)
        .eq("user_id", user.id);

      if (notesDeleteError) {
        console.error("Error deleting notes:", notesDeleteError);
      }

      // Delete events
      const { error: eventsDeleteError } = await supabase
        .from("job_application_events")
        .delete()
        .eq("job_id", id)
        .eq("user_id", user.id);

      if (eventsDeleteError) {
        console.error("Error deleting events:", eventsDeleteError);
      }

      // Delete the main job record
      const { error } = await supabase
        .from("job_applications")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting job:", error);
        throw error;
      }

      // Update local state
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== id));
    } catch (error: any) {
      console.error("Exception deleting job:", error);
      toast({
        title: "Error removing job",
        description: error.message || "Could not remove the job application.",
        variant: "destructive",
      });
    }
  };

  const value = {
    jobs,
    isLoading,
    addJob,
    deleteJob,
    updateJob,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};
