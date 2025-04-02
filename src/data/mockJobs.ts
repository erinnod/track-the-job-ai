
export interface JobApplication {
  id: string;
  company: string;
  position: string;
  location: string;
  status: "applied" | "interview" | "offer" | "rejected" | "saved";
  appliedDate: string;
  lastUpdated: string;
  logo?: string;
  companyWebsite?: string;
  salary?: string;
  jobDescription?: string;
  notes?: string[];
  contacts?: {
    name: string;
    email: string;
    phone?: string;
    position?: string;
  }[];
  events?: {
    date: string;
    title: string;
    description?: string;
  }[];
}

export const statusColors = {
  applied: "bg-blue-500",
  interview: "bg-yellow-500",
  offer: "bg-green-500",
  rejected: "bg-red-500",
  saved: "bg-gray-500",
};

export const statusLabels = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  saved: "Saved",
};

export const mockJobs: JobApplication[] = [
  {
    id: "1",
    company: "TechCorp",
    position: "Frontend Developer",
    location: "San Francisco, CA (Remote)",
    status: "interview",
    appliedDate: "2023-04-10",
    lastUpdated: "2023-04-15",
    logo: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=40&h=40&fit=crop",
    companyWebsite: "https://techcorp.com",
    salary: "$90,000 - $120,000",
    jobDescription: "Frontend developer position working with React, TypeScript and modern web technologies.",
    notes: [
      "Had initial screening with HR on April 12",
      "Technical interview scheduled for April 20"
    ],
    contacts: [
      {
        name: "Sarah Johnson",
        email: "sjohnson@techcorp.com",
        position: "HR Manager"
      }
    ],
    events: [
      {
        date: "2023-04-12",
        title: "Initial Screening",
        description: "30-minute call with HR to discuss background and experience"
      },
      {
        date: "2023-04-20",
        title: "Technical Interview",
        description: "90-minute video interview with the engineering team"
      }
    ]
  },
  {
    id: "2",
    company: "DataSystems",
    position: "Full Stack Engineer",
    location: "Boston, MA",
    status: "applied",
    appliedDate: "2023-04-08",
    lastUpdated: "2023-04-08",
    logo: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=40&h=40&fit=crop",
    companyWebsite: "https://datasystems.io",
    salary: "$100,000 - $130,000",
    jobDescription: "Full stack engineer working with Node.js, React, and PostgreSQL."
  },
  {
    id: "3",
    company: "CloudNet",
    position: "React Developer",
    location: "Remote",
    status: "rejected",
    appliedDate: "2023-04-01",
    lastUpdated: "2023-04-10",
    logo: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=40&h=40&fit=crop",
    companyWebsite: "https://cloudnet.com",
    notes: [
      "Received rejection email on April 10",
      "Mentioned they'll keep my resume on file for future opportunities"
    ]
  },
  {
    id: "4",
    company: "WebSolutions",
    position: "UI Developer",
    location: "New York, NY (Hybrid)",
    status: "offer",
    appliedDate: "2023-03-20",
    lastUpdated: "2023-04-16",
    logo: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=40&h=40&fit=crop",
    salary: "$95,000 - $115,000",
    notes: [
      "Received offer on April 16",
      "Need to respond by April 23"
    ],
    contacts: [
      {
        name: "Michael Chen",
        email: "mchen@websolutions.com",
        phone: "555-123-4567",
        position: "Tech Lead"
      }
    ]
  },
  {
    id: "5",
    company: "InnovateTech",
    position: "JavaScript Developer",
    location: "Austin, TX",
    status: "saved",
    appliedDate: "",
    lastUpdated: "2023-04-05",
    logo: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=40&h=40&fit=crop",
    companyWebsite: "https://innovatetech.com",
    jobDescription: "JavaScript developer role focused on building modern web applications with React and Node.js."
  }
];

export const getStatusCount = (jobs: JobApplication[]) => {
  return {
    applied: jobs.filter(job => job.status === "applied").length,
    interview: jobs.filter(job => job.status === "interview").length,
    offer: jobs.filter(job => job.status === "offer").length,
    rejected: jobs.filter(job => job.status === "rejected").length,
    saved: jobs.filter(job => job.status === "saved").length,
    total: jobs.length
  };
};
