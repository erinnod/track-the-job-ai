import { JobApplication } from "@/data/mockJobs";
import { v4 as uuidv4 } from "uuid";

const CSV_HEADERS = [
  "company",
  "position",
  "location",
  "status",
  "appliedDate",
  "salary",
  "companyWebsite",
  "workType",
  "employmentType",
  "remote",
  "jobDescription",
];

/**
 * Escapes a value for safe inclusion in a CSV cell.
 * Wraps in quotes if the value contains commas, quotes, or newlines.
 */
function escapeCsvValue(value: string | boolean | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of JobApplication objects to a CSV string and triggers a download.
 */
export function exportJobsToCSV(jobs: JobApplication[]): void {
  const header = CSV_HEADERS.join(",");

  const rows = jobs.map((job) =>
    [
      escapeCsvValue(job.company),
      escapeCsvValue(job.position),
      escapeCsvValue(job.location),
      escapeCsvValue(job.status),
      escapeCsvValue(job.appliedDate),
      escapeCsvValue(job.salary),
      escapeCsvValue(job.companyWebsite),
      escapeCsvValue(job.workType),
      escapeCsvValue(job.employmentType),
      escapeCsvValue(String(job.remote ?? false)),
      escapeCsvValue(job.jobDescription),
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `jobtrakr-export-${new Date().toISOString().split("T")[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses a single CSV row, correctly handling quoted fields.
 */
function parseCSVRow(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }

  values.push(current);
  return values;
}

export interface ParseResult {
  jobs: Partial<JobApplication>[];
  errors: string[];
}

/**
 * Parses a CSV string into an array of partial JobApplication objects.
 * Returns both successfully parsed jobs and any row-level errors.
 */
export function parseCSVToJobs(csvText: string): ParseResult {
  const errors: string[] = [];
  const jobs: Partial<JobApplication>[] = [];

  // Normalize line endings
  const lines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");

  if (lines.length < 2) {
    return { jobs, errors: ["CSV file is empty or has no data rows."] };
  }

  const headers = parseCSVRow(lines[0]).map((h) => h.trim().toLowerCase());

  // Flexible header mapping — accepts common variants
  const headerMap: Record<string, keyof JobApplication> = {
    company: "company",
    position: "position",
    "job title": "position",
    title: "position",
    location: "location",
    status: "status",
    applieddate: "appliedDate",
    "applied date": "appliedDate",
    "date applied": "appliedDate",
    salary: "salary",
    compensation: "salary",
    companywebsite: "companyWebsite",
    "company website": "companyWebsite",
    website: "companyWebsite",
    url: "companyWebsite",
    worktype: "workType",
    "work type": "workType",
    "work arrangement": "workType",
    employmenttype: "employmentType",
    "employment type": "employmentType",
    "job type": "employmentType",
    remote: "remote",
    jobdescription: "jobDescription",
    "job description": "jobDescription",
    description: "jobDescription",
    notes: "notes",
  };

  const mappedHeaders = headers.map((h) => headerMap[h] ?? null);

  const validStatuses = new Set(["applied", "interview", "offer", "rejected", "saved"]);
  const validWorkTypes = new Set(["On-site", "Remote", "Hybrid"]);
  const validEmploymentTypes = new Set(["Full-time", "Part-time"]);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVRow(line);
    const raw: Record<string, string> = {};

    mappedHeaders.forEach((field, index) => {
      if (field && values[index] !== undefined) {
        raw[field] = values[index].trim();
      }
    });

    if (!raw.company && !raw.position) {
      errors.push(`Row ${i}: Skipped — missing both company and position.`);
      continue;
    }

    // Normalise status
    let status = raw.status?.toLowerCase() ?? "saved";
    if (!validStatuses.has(status)) {
      errors.push(`Row ${i}: Unknown status "${raw.status}" — defaulting to "saved".`);
      status = "saved";
    }

    // Normalise workType with case-insensitive match
    let workType: JobApplication["workType"] = "On-site";
    if (raw.workType) {
      const match = [...validWorkTypes].find(
        (w) => w.toLowerCase() === raw.workType.toLowerCase()
      );
      workType = (match as JobApplication["workType"]) ?? "On-site";
    }

    // Normalise employmentType
    let employmentType: JobApplication["employmentType"] = "Full-time";
    if (raw.employmentType) {
      const match = [...validEmploymentTypes].find(
        (e) => e.toLowerCase() === raw.employmentType.toLowerCase()
      );
      employmentType = (match as JobApplication["employmentType"]) ?? "Full-time";
    }

    const remote =
      raw.remote?.toLowerCase() === "true" || raw.remote === "1" || raw.remote?.toLowerCase() === "yes";

    jobs.push({
      id: uuidv4(),
      company: raw.company || "",
      position: raw.position || "",
      location: raw.location || "",
      status: status as JobApplication["status"],
      appliedDate: raw.appliedDate || "",
      salary: raw.salary || "",
      companyWebsite: raw.companyWebsite || "",
      workType,
      employmentType,
      remote,
      jobDescription: raw.jobDescription || "",
      notes: raw.notes ? [raw.notes] : [],
      contacts: [],
      events: [],
      lastUpdated: new Date().toISOString(),
    });
  }

  return { jobs, errors };
}
