import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useJobs } from "@/contexts/JobContext";
import { exportJobsToCSV, parseCSVToJobs } from "@/utils/csvUtils";
import { JobApplication } from "@/data/mockJobs";
import { useToast } from "@/components/ui/use-toast";

interface CsvExportImportProps {
  /** Optional subset of jobs to export (defaults to all jobs in context) */
  exportJobs?: JobApplication[];
}

const CsvExportImport = ({ exportJobs }: CsvExportImportProps) => {
  const { jobs, addJob } = useJobs();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [parsedJobs, setParsedJobs] = useState<Partial<JobApplication>[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleExport = () => {
    const jobsToExport = exportJobs ?? jobs;
    if (jobsToExport.length === 0) {
      toast({
        title: "Nothing to export",
        description: "You have no job applications to export.",
        variant: "destructive",
      });
      return;
    }
    exportJobsToCSV(jobsToExport);
    toast({
      title: "Export successful",
      description: `Exported ${jobsToExport.length} application${jobsToExport.length !== 1 ? "s" : ""} to CSV.`,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { jobs: parsed, errors } = parseCSVToJobs(text);
      setParsedJobs(parsed);
      setParseErrors(errors);
      setImportDialogOpen(true);
    };
    reader.readAsText(file);

    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleConfirmImport = async () => {
    if (parsedJobs.length === 0) return;

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const job of parsedJobs) {
      try {
        await addJob(job as JobApplication);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsImporting(false);
    setImportDialogOpen(false);
    setParsedJobs([]);
    setParseErrors([]);

    toast({
      title: "Import complete",
      description:
        failCount > 0
          ? `Imported ${successCount} job${successCount !== 1 ? "s" : ""}. ${failCount} failed.`
          : `Successfully imported ${successCount} job${successCount !== 1 ? "s" : ""}.`,
      variant: failCount > 0 ? "destructive" : "default",
    });
  };

  const handleCancelImport = () => {
    setImportDialogOpen(false);
    setParsedJobs([]);
    setParseErrors([]);
    setFileName("");
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Export button */}
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>

        {/* Import button — triggers hidden file input */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Import preview dialog */}
      <Dialog open={importDialogOpen} onOpenChange={handleCancelImport}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import from CSV</DialogTitle>
            <DialogDescription>
              Previewing <strong>{fileName}</strong>. Review the data below
              before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Errors / warnings */}
            {parseErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">
                    {parseErrors.length} row{parseErrors.length !== 1 ? "s" : ""} had issues:
                  </p>
                  <ul className="text-xs space-y-0.5 list-disc pl-4">
                    {parseErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {parsedJobs.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="font-medium">No valid rows found.</p>
                <p className="text-sm mt-1">
                  Make sure the file has <code>company</code> and{" "}
                  <code>position</code> columns.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {parsedJobs.length} job{parsedJobs.length !== 1 ? "s" : ""} ready to import
                  </span>
                </div>

                {/* Preview table */}
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Company</th>
                        <th className="text-left px-3 py-2 font-medium">Position</th>
                        <th className="text-left px-3 py-2 font-medium">Status</th>
                        <th className="text-left px-3 py-2 font-medium">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedJobs.slice(0, 10).map((job, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-2 font-medium truncate max-w-[120px]">
                            {job.company}
                          </td>
                          <td className="px-3 py-2 truncate max-w-[140px]">
                            {job.position}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-xs">
                              {job.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-gray-500 truncate max-w-[100px]">
                            {job.location || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedJobs.length > 10 && (
                    <p className="text-xs text-gray-500 text-center py-2 bg-gray-50">
                      …and {parsedJobs.length - 10} more
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelImport}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={isImporting || parsedJobs.length === 0}
            >
              {isImporting
                ? "Importing…"
                : `Import ${parsedJobs.length} Job${parsedJobs.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CsvExportImport;
