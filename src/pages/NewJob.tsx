import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JobForm from "@/components/jobs/JobForm";
import { JobApplication } from "@/data/mockJobs";
import { toast } from "@/components/ui/use-toast";

const NewJob = () => {
  const navigate = useNavigate();

  const handleSubmit = (job: JobApplication) => {
    // Here you would typically send the job data to your backend/API
    // For now, we'll just show a success message and redirect

    toast({
      title: "Success",
      description: "Job application added successfully",
    });

    // After successful submission, navigate back to the jobs page
    navigate("/applications");
  };

  const handleCancel = () => {
    // Navigate back without saving
    navigate(-1);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Add New Job Application
          </CardTitle>
        </CardHeader>
        <CardContent>
          <JobForm onSubmit={handleSubmit} onCancel={handleCancel} />

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Find the form submit button by its id and click it
                document.getElementById("job-form-submit")?.click();
              }}
            >
              Save Job
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewJob;
