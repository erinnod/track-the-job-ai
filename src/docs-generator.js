// Create a new PDF document using the UMD version of jsPDF
const { jsPDF } = window.jspdf;
const doc = new jsPDF();

// Page settings
let currentPage = 1;
let yPosition = 20;
const pageWidth = 210;
const margin = 20;
const lineHeight = 7;
const contentWidth = pageWidth - 2 * margin;

// Helper functions for formatting text
const addTitle = (text) => {
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(text, margin, yPosition);
  yPosition += 12;
};

const addHeading = (text) => {
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(text, margin, yPosition);
  yPosition += 10;
};

const addSubheading = (text) => {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(text, margin, yPosition);
  yPosition += 8;
};

const addParagraph = (text) => {
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Split text to fit width
  const textLines = doc.splitTextToSize(text, contentWidth);

  // Check if we need a new page
  if (yPosition + textLines.length * lineHeight > 280) {
    doc.addPage();
    currentPage++;
    yPosition = 20;
  }

  doc.text(textLines, margin, yPosition);
  yPosition += textLines.length * lineHeight + 5;
};

const addFooter = () => {
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(`Page ${currentPage}`, pageWidth - margin - 10, 290);
};

// Add document title
addTitle("JobTrakr: Job Application Tracking System");
addParagraph(
  "Technical Documentation - Generated " + new Date().toLocaleDateString()
);
yPosition += 10;

// Introduction
addHeading("1. Introduction");
addParagraph(
  "JobTrakr is a comprehensive job application tracking system built with React, TypeScript, and Supabase. " +
    "It helps job seekers organize and monitor their job applications throughout the entire job search process. " +
    "The application provides features for tracking application status, managing interviews, storing relevant documents, " +
    "and visualizing job search progress through an intuitive dashboard."
);

// Architecture Overview
addHeading("2. Architecture Overview");
addParagraph(
  "The application is built with a modern tech stack featuring React for the frontend, TypeScript for type safety, " +
    "and Supabase as the backend-as-a-service for database and authentication. " +
    "It utilizes a component-based architecture with context API for state management."
);

// Add a page break
doc.addPage();
currentPage++;
yPosition = 20;

// Tech Stack
addHeading("3. Technology Stack");

addSubheading("3.1. Frontend");
addParagraph(
  "- React: JavaScript library for building the user interface\n" +
    "- TypeScript: Adds static typing to JavaScript for better reliability\n" +
    "- React Router: Manages application routing\n" +
    "- React Hook Form: Handles form validation and submission\n" +
    "- Tailwind CSS: Utility-first CSS framework for styling\n" +
    "- Shadcn UI: Component library based on Radix UI\n" +
    "- Recharts: Charting library for data visualization\n" +
    "- Date-fns: Library for date manipulation"
);

addSubheading("3.2. Backend");
addParagraph(
  "- Supabase: Backend-as-a-service with PostgreSQL database\n" +
    "- Supabase Auth: Authentication and user management\n" +
    "- PostgreSQL: Relational database for data storage"
);

addSubheading("3.3. Development Tools");
addParagraph(
  "- Vite: Frontend build tool and development server\n" +
    "- ESLint: Code linting\n" +
    "- npm: Package management"
);

// Database Structure
addHeading("4. Database Structure");
addParagraph(
  "The application uses a PostgreSQL database provided by Supabase with the following tables:"
);

addSubheading("4.1. profiles");
addParagraph(
  "Stores user profile information including first name, last name, email, phone, and avatar URL. " +
    "Linked to the Supabase auth.users table via the id field."
);

addSubheading("4.2. professional_details");
addParagraph(
  "Contains professional information for users such as title, company, industry, and location. " +
    "Each record is associated with a user via the user_id field."
);

addSubheading("4.3. notification_preferences");
addParagraph(
  "Stores user preferences for notifications including email and SMS settings, job matches, " +
    "application status updates, interview reminders, and marketing communications."
);

// Add a page break
doc.addPage();
currentPage++;
yPosition = 20;

addSubheading("4.4. job_applications");
addParagraph(
  "The core table that stores job application data including company, position, location, status, " +
    "applied date, salary information, job description, and more. Each job application is linked to a user."
);

addSubheading("4.5. job_application_contacts");
addParagraph(
  "Stores contact information for each job application, including name, email, phone, and position."
);

addSubheading("4.6. job_application_notes");
addParagraph(
  "Contains notes related to job applications, allowing users to add comments or reminders."
);

addSubheading("4.7. job_application_events");
addParagraph(
  "Tracks events related to job applications such as interviews, follow-ups, or other important dates."
);

// Application Components
addHeading("5. Application Structure");

addSubheading("5.1. Frontend Routing");
addParagraph(
  "The application uses React Router for navigation with the following routes:\n\n" +
    "- / : Dashboard with application statistics and overview\n" +
    "- /applications : List of all job applications\n" +
    "- /kanban : Kanban board for visual tracking of applications\n" +
    "- /documents : Document storage and management\n" +
    "- /calendar : Calendar view of interviews and events\n" +
    "- /settings : User settings and preferences\n" +
    "- /login : User login page\n" +
    "- /signup : New user registration page"
);

// Add a page break
doc.addPage();
currentPage++;
yPosition = 20;

addSubheading("5.2. Key Components");
addParagraph(
  "5.2.1. Layout Components\n" +
    "- Layout: Main layout wrapper with sidebar and navbar\n" +
    "- Sidebar: Navigation sidebar with links to different sections\n" +
    "- Navbar: Top navigation bar with user menu and actions\n\n" +
    "5.2.2. Job Management Components\n" +
    "- JobList: Displays list of job applications with filtering and sorting\n" +
    "- JobCard: Card view of a single job application\n" +
    "- JobDetailsModal: Modal for viewing detailed job information\n" +
    "- JobForm: Form for adding or editing job applications\n" +
    "- AddJobModal: Modal wrapper for adding new jobs\n" +
    "- EditJobModal: Modal wrapper for editing existing jobs\n\n" +
    "5.2.3. Dashboard Components\n" +
    "- StatsOverview: Overview of application statistics\n" +
    "- ApplicationStats: Detailed application statistics and charts\n" +
    "- ApplicationTimeline: Timeline of recent application activities\n" +
    "- JobTypeAnalysis: Analysis of job types and categories\n" +
    "- RecentActivity: Recent activities related to job applications\n\n" +
    "5.2.4. Authentication Components\n" +
    "- ProtectedRoute: Route component that requires authentication\n" +
    "- Login: Login form component\n" +
    "- SignUp: Registration form component"
);

// Add a page break
doc.addPage();
currentPage++;
yPosition = 20;

// State Management
addHeading("6. State Management");
addParagraph(
  "The application uses React Context API for global state management with the following key contexts:"
);

addSubheading("6.1. AuthContext");
addParagraph(
  "Manages authentication state including user information, login status, and authentication functions. " +
    "It provides the following: \n\n" +
    "- user: The currently logged-in user object\n" +
    "- isLoading: Loading state for authentication operations\n" +
    "- isAuthenticated: Boolean indicating if a user is logged in\n" +
    "- logout: Function to log out the current user\n" +
    "- refreshUser: Function to refresh the current user information"
);

addSubheading("6.2. AvatarContext");
addParagraph(
  "Manages the user avatar state, providing a consistent user avatar across the application."
);

addSubheading("6.3. JobContext");
addParagraph(
  "The core context for managing job application data, providing these features:\n\n" +
    "- jobs: Array of job applications for the current user\n" +
    "- isLoading: Loading state for job operations\n" +
    "- addJob: Function to add a new job application\n" +
    "- deleteJob: Function to delete a job application\n" +
    "- updateJob: Function to update an existing job application\n\n" +
    "JobContext manages complex CRUD operations, handling related data like contacts, notes, and events."
);

// Add a page break
doc.addPage();
currentPage++;
yPosition = 20;

// Authentication and Security
addHeading("7. Authentication and Security");
addParagraph(
  "The application uses Supabase Authentication for secure user management. Features include:"
);

addSubheading("7.1. Authentication Methods");
addParagraph(
  "- Email and password authentication\n" +
    "- Password reset functionality\n" +
    "- Session management"
);

addSubheading("7.2. Security Measures");
addParagraph(
  "- Row Level Security (RLS) in PostgreSQL ensures users can only access their own data\n" +
    "- Protected routes restrict access to authenticated users\n" +
    "- Secure password handling via Supabase Auth\n" +
    "- HTTPS for secure data transmission"
);

// Data Flow
addHeading("8. Data Flow");
addParagraph(
  "The application follows a typical data flow pattern for React applications:"
);

addSubheading("8.1. Data Retrieval");
addParagraph(
  "1. User logs in and the AuthContext establishes their identity\n" +
    "2. JobContext fetches job applications for the current user from Supabase\n" +
    "3. Related data (contacts, notes, events) is fetched and combined with job data\n" +
    "4. Data is stored in the JobContext state and made available to components\n" +
    "5. Components subscribe to the JobContext and render data as needed"
);

addSubheading("8.2. Data Modification");
addParagraph(
  "1. User interacts with forms or components to create, update, or delete data\n" +
    "2. Components call context functions (addJob, updateJob, deleteJob)\n" +
    "3. Context functions update the database via Supabase API calls\n" +
    "4. On successful database operations, the local state is updated\n" +
    "5. Components re-render with the updated data"
);

// Add a page break
doc.addPage();
currentPage++;
yPosition = 20;

// UI Design
addHeading("9. User Interface");
addParagraph(
  "The application features a modern, responsive UI built with Tailwind CSS and Shadcn UI components:"
);

addSubheading("9.1. Design System");
addParagraph(
  "- Color Scheme: Professional blues and grays with accent colors for status indicators\n" +
    "- Typography: Clean, readable font hierarchy\n" +
    "- Components: Card-based design for job applications\n" +
    "- Responsive: Mobile-friendly layouts that adapt to different screen sizes"
);

addSubheading("9.2. Key UI Features");
addParagraph(
  "- Dashboard: Visual overview of job application statistics\n" +
    "- Job List: Filterable, sortable list of job applications\n" +
    "- Kanban Board: Visual job status tracking\n" +
    "- Calendar: Timeline view of interviews and important dates\n" +
    "- Detail Views: Comprehensive job application information\n" +
    "- Forms: User-friendly input for job application data"
);

// Future Enhancements
addHeading("10. Future Enhancements");
addParagraph(
  "Potential improvements and additions to the application include:"
);

addSubheading("10.1. Features");
addParagraph(
  "- Email notifications for application updates and reminders\n" +
    "- AI-powered job matching and suggestions\n" +
    "- Resume parsing and management\n" +
    "- Integration with job posting platforms\n" +
    "- Mobile application version\n" +
    "- Advanced analytics and insights\n" +
    "- Interview preparation tools and resources"
);

addSubheading("10.2. Technical Improvements");
addParagraph(
  "- Offline support and data synchronization\n" +
    "- Performance optimizations for larger datasets\n" +
    "- End-to-end testing suite\n" +
    "- Progressive Web App (PWA) features\n" +
    "- Accessibility improvements"
);

// Add a page break
doc.addPage();
currentPage++;
yPosition = 20;

// Conclusion
addHeading("11. Conclusion");
addParagraph(
  "JobTrakr provides a comprehensive solution for job seekers to manage their job application process efficiently. " +
    "Built with modern web technologies and a focus on user experience, it offers a robust platform for tracking applications, " +
    "managing important dates, and visualizing progress throughout the job search journey.\n\n" +
    "The application demonstrates effective use of React, TypeScript, and Supabase to create a secure, " +
    "scalable, and user-friendly web application with a clean, component-based architecture."
);

// Add footers to all pages
for (let i = 1; i <= currentPage; i++) {
  doc.setPage(i);
  addFooter();
}

// Save the PDF
doc.save("JobTrakr_Documentation.pdf");

console.log("PDF documentation has been generated successfully!");
