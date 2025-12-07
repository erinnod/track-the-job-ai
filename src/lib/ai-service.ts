import { supabase } from "./supabase";
import {
  AIGeneratedContent,
  AIContentType,
  ResumeGenerationOptions,
  CoverLetterGenerationOptions,
  JobRecommendationOptions,
} from "@/types/ai";
import { v4 as uuidv4 } from "uuid";
import { checkCreditBalance, useCreditForFeature } from "./payments-service";
import { generateWithGemini } from "./gemini-service";
import { getDocumentContent } from "./document-service";

// Convert DB row to frontend format
const mapAIContentFromDB = (dbContent: any): AIGeneratedContent => ({
  id: dbContent.id,
  userId: dbContent.user_id,
  contentType: dbContent.content_type as AIContentType,
  title: dbContent.title,
  content: dbContent.content,
  sourceDocumentId: dbContent.source_document_id || undefined,
  jobApplicationId: dbContent.job_application_id || undefined,
  createdAt: dbContent.created_at,
  updatedAt: dbContent.updated_at,
});

// Fetch all AI content for a user
export const fetchUserAIContent = async (
  userId: string,
  contentType?: AIContentType
): Promise<AIGeneratedContent[]> => {
  try {
    let query = supabase
      .from("ai_generated_content")
      .select("*")
      .eq("user_id", userId);

    if (contentType) {
      query = query.eq("content_type", contentType);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      throw error;
    }

    return data ? data.map(mapAIContentFromDB) : [];
  } catch (error) {
    console.error("Error fetching AI content:", error);
    throw error;
  }
};

// Fetch a specific AI content item
export const fetchAIContent = async (
  contentId: string
): Promise<AIGeneratedContent | null> => {
  try {
    const { data, error } = await supabase
      .from("ai_generated_content")
      .select("*")
      .eq("id", contentId)
      .single();

    if (error) {
      throw error;
    }

    return data ? mapAIContentFromDB(data) : null;
  } catch (error) {
    console.error("Error fetching AI content item:", error);
    throw error;
  }
};

// Save AI content
export const saveAIContent = async (
  userId: string,
  contentType: AIContentType,
  title: string,
  content: string,
  sourceDocumentId?: string,
  jobApplicationId?: string
): Promise<AIGeneratedContent> => {
  try {
    console.log("Saving AI content for user:", userId);

    // First get the current user session to ensure we have auth context
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("Current session exists:", !!sessionData.session);

    if (!sessionData.session) {
      // If no session found, try refreshing the session
      const { data: refreshData } = await supabase.auth.refreshSession();
      console.log("Session refresh result:", !!refreshData.session);

      if (!refreshData.session) {
        // If still no session, we need to handle this error
        console.error(
          "No active session found - this will cause RLS policy violations"
        );
      }
    }

    // Proceed with insert operation
    const { data, error } = await supabase
      .from("ai_generated_content")
      .insert([
        {
          user_id: userId,
          content_type: contentType,
          title,
          content,
          source_document_id: sourceDocumentId,
          job_application_id: jobApplicationId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error details from Supabase:", error);
      throw error;
    }

    return mapAIContentFromDB(data);
  } catch (error) {
    console.error("Error saving AI content:", error);
    throw error;
  }
};

// Delete AI content
export const deleteAIContent = async (contentId: string): Promise<void> => {
  try {
    console.log("Attempting to delete AI content with ID:", contentId);

    // Get the current session to ensure we have auth context for RLS
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("Current session exists:", !!sessionData.session);

    if (!sessionData.session) {
      // Try to refresh the session if it doesn't exist
      console.log("No active session, attempting to refresh...");
      const { data: refreshData } = await supabase.auth.refreshSession();
      console.log("Session refresh result:", !!refreshData.session);

      if (!refreshData.session) {
        console.error(
          "No active session found - RLS will likely cause permission denied"
        );
      }
    }

    // Execute the delete operation
    const { error } = await supabase
      .from("ai_generated_content")
      .delete()
      .eq("id", contentId);

    if (error) {
      console.error("Error details from Supabase:", error);
      throw error;
    }

    console.log("AI content deleted successfully");
  } catch (error) {
    console.error("Error deleting AI content:", error);
    throw error;
  }
};

// Generate AI resume using Gemini
export const generateAIResume = async (
  userId: string,
  resumeDocumentId: string,
  options: ResumeGenerationOptions
): Promise<AIGeneratedContent> => {
  try {
    console.log("[AI SERVICE] Starting resume generation for user:", userId);
    console.log("[AI SERVICE] Document ID:", resumeDocumentId);
    console.log("[AI SERVICE] Options:", JSON.stringify(options));

    // Step 1: Verify we have an API key configured
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[AI SERVICE] ERROR: Gemini API key not configured!");
      throw new Error(
        "Gemini API key not configured. Please set VITE_GEMINI_API_KEY environment variable."
      );
    }

    // Step 2: Check credit balance (for production)
    let hasCredits = true;
    try {
      // In development mode, skip credit checks completely
      if (import.meta.env.DEV) {
        console.log("[AI SERVICE] DEV MODE: Bypassing credit check entirely");
        hasCredits = true;
      } else {
        hasCredits = await checkCreditBalance(userId, "resume");
        console.log("[AI SERVICE] Credit check result:", hasCredits);
      }
    } catch (creditError) {
      console.error("[AI SERVICE] Error checking credits:", creditError);
      // For development, bypass credit check if there's an error
      if (import.meta.env.DEV) {
        console.log(
          "[AI SERVICE] DEV MODE: Bypassing credit check due to error"
        );
        hasCredits = true;
      }
    }

    if (!hasCredits) {
      throw new Error("Insufficient credits to generate resume");
    }

    // Step 3: Fetch document content
    console.log("[AI SERVICE] Fetching document content...");
    let resumeContent;
    try {
      resumeContent = await getDocumentContent(resumeDocumentId);
      console.log(
        "[AI SERVICE] Document content length:",
        resumeContent.length
      );

      if (!resumeContent || resumeContent.trim().length === 0) {
        throw new Error("Failed to extract content from document");
      }

      console.log(
        "[AI SERVICE] Content preview:",
        resumeContent.substring(0, 100) + "..."
      );
    } catch (docError) {
      console.error("[AI SERVICE] Error fetching document content:", docError);
      throw new Error(`Failed to read resume document: ${docError.message}`);
    }

    // Step 4: Create system prompt
    const systemPrompt =
      "You are an expert CV writer and career coach specializing in ATS optimization and professional formatting. Create a tailored, professional resume in clean markdown format that will help the candidate pass ATS screening and impress human reviewers.";

    // Step 5: Create user prompt with clear structure
    console.log("[AI SERVICE] Creating prompt with user's template...");
    const prompt = `
I need a tailored CV/resume for a job application. Please optimize my existing CV for this specific role.

## MY CURRENT CV/RESUME
${resumeContent}

## TARGET POSITION DETAILS
- Job Title: ${options.targetJobTitle || "Not specified"}
- Company: ${options.targetCompany || "Not specified"}
- Job Description: ${options.targetJobDescription || "Not provided"}
- Key Skills to Highlight: ${
      options.highlightSkills?.join(", ") || "Not specified"
    }
- Desired Tone: ${options.tone || "Professional"}

## INSTRUCTIONS
1. Reformat and tailor my CV specifically for this job opportunity
2. Highlight relevant skills and experiences that match the job requirements
3. Use professional, impact-driven bullet points with quantified achievements where possible
4. Make it ATS-friendly with appropriate keywords without keyword stuffing
5. Maintain the same career history and education - do not invent or fabricate details
6. Return the complete CV in clean markdown format
7. Do not include explanatory notes or comments in your response

Important: Only include factual information from my original CV - do not invent new jobs, roles, or qualifications.
`;

    console.log("[AI SERVICE] Prompt prepared, length:", prompt.length);

    // Step 6: Call Gemini API with improved parameters
    console.log("[AI SERVICE] Calling Gemini API...");
    let generatedContent;
    try {
      generatedContent = await generateWithGemini(prompt, {
        temperature: 0.2, // Lower temperature for more consistent output
        maxTokens: 4000, // Increased token limit for complete resumes
        systemPrompt,
      });

      if (!generatedContent || generatedContent.trim().length === 0) {
        throw new Error("Gemini API returned empty content");
      }

      console.log(
        "[AI SERVICE] API call successful. Content length:",
        generatedContent.length
      );
      console.log(
        "[AI SERVICE] Response preview:",
        generatedContent.substring(0, 100) + "..."
      );
    } catch (apiError) {
      // Add detailed logging to understand the exact error
      console.error("[AI SERVICE] Gemini API detailed error:", {
        message: apiError.message,
        stack: apiError.stack,
        name: apiError.name,
        originalError: apiError,
      });

      // Check specifically for quota/rate limit errors
      if (
        apiError.message &&
        (apiError.message.includes("exceeded your current quota") ||
          apiError.message.includes("RESOURCE_EXHAUSTED") ||
          apiError.message.includes("rate limit"))
      ) {
        console.log(
          "[AI SERVICE] API rate limited, using fallback content generator"
        );

        try {
          // One more retry with a simplified prompt
          const simplifiedPrompt = `
Please create a tailored resume for a ${
            options.targetJobTitle || "professional"
          } position at ${options.targetCompany || "the company"}.
Here's my current resume content:
${resumeContent.substring(0, 1500)}...

Key skills to highlight: ${
            options.highlightSkills?.join(", ") || "Not specified"
          }
`;

          console.log("[AI SERVICE] Trying with simplified prompt");
          generatedContent = await generateWithGemini(simplifiedPrompt, {
            temperature: 0.3,
            maxTokens: 2500, // Smaller token limit to reduce chances of hitting quota
            systemPrompt: "Create a concise professional resume",
          });

          if (generatedContent && generatedContent.trim().length > 0) {
            console.log(
              "[AI SERVICE] Successfully generated with simplified prompt"
            );
          } else {
            throw new Error("Failed with simplified prompt too");
          }
        } catch (fallbackError) {
          console.log(
            "[AI SERVICE] Even simplified prompt failed, using local fallback"
          );
          // Use the example content generator as final fallback
          generatedContent = createExampleTailoredResume(
            resumeContent,
            options
          );
          console.log(
            "[AI SERVICE] Created fallback content successfully. Length:",
            generatedContent.length
          );
        }
      } else {
        // Log the specific error for debugging
        console.error("[AI SERVICE] Gemini API error:", apiError.message);

        // For all errors in development mode, use example content
        if (import.meta.env.DEV) {
          console.log(
            "[AI SERVICE] DEV MODE: Using example content despite error"
          );
          generatedContent = createExampleTailoredResume(
            resumeContent,
            options
          );
        } else {
          throw new Error(`Failed to generate resume: ${apiError.message}`);
        }
      }
    }

    // Step 7: Clean up the content and save
    const cleanedContent = removeNoteSection(generatedContent);
    console.log("[AI SERVICE] Saving content to database...");

    // Step 8: Save to database
    const contentData = await saveAIContent(
      userId,
      "resume",
      `Tailored Resume for ${
        options.targetCompany || options.targetJobTitle || "Job Application"
      }`,
      cleanedContent,
      resumeDocumentId
    );

    // Step 9: Use one credit (for production)
    try {
      // Skip credit usage completely in development mode
      if (import.meta.env.DEV) {
        console.log("[AI SERVICE] DEV MODE: Skipping credit usage completely");
      } else {
        await useCreditForFeature(userId, "resume");
      }
    } catch (creditError) {
      console.error(
        "[AI SERVICE] Error using credit (non-fatal):",
        creditError
      );
      // Continue even if credit usage fails - the content is already generated
      // In development, log a clearer message
      if (import.meta.env.DEV) {
        console.log(
          "[AI SERVICE] DEV MODE: Continuing without credit deduction due to error"
        );
      }
    }

    return contentData;
  } catch (error) {
    console.error("[AI SERVICE] Error generating resume:", error);
    throw error;
  }
};

/**
 * Create an example tailored resume to demonstrate how it should work
 * This function serves as a fallback when the Gemini API is unavailable
 */
function createExampleTailoredResume(
  originalResume: string,
  options: ResumeGenerationOptions
): string {
  console.log(
    "[AI SERVICE] Creating example resume based on original content and options"
  );

  try {
    // Extract key information from the original resume
    // Name extraction
    const nameMatch = originalResume.match(/# ([\w\s]+)( -|:)/);
    const name = nameMatch ? nameMatch[1].trim() : "John Smith";

    // Try to extract an existing summary if available
    const summaryMatch = originalResume.match(
      /## (Professional |)Summary\s*\n([^\n#]+)/i
    );
    const existingSummary = summaryMatch ? summaryMatch[2].trim() : "";

    // Try to extract existing skills
    const skillsMatch = originalResume.match(/## Skills\s*\n((?:[^\n#]+\n)+)/i);
    const existingSkills = skillsMatch ? skillsMatch[1].trim() : "";

    // Try to extract experience sections
    const experienceMatch = originalResume.match(
      /## (Work |Professional |)Experience\s*\n([\s\S]+?)(?=##|$)/i
    );
    const existingExperience = experienceMatch ? experienceMatch[2].trim() : "";

    // Combine original content with targeting for the job
    let targetedSummary = "";
    if (existingSummary) {
      // Use existing summary but add targeting elements
      targetedSummary =
        existingSummary +
        `\n\nEager to apply my skills as a ${
          options.targetJobTitle || "professional"
        } at ${options.targetCompany || "your company"}.`;
    } else {
      // Create a generic summary
      targetedSummary = `Experienced ${
        options.targetJobTitle || "professional"
      } with a proven track record of delivering high-quality solutions, seeking to leverage my expertise in ${
        options.highlightSkills?.join(", ") || "my field"
      } at ${options.targetCompany || "your company"}.`;
    }

    // Combine original skills with highlighted skills
    let skillsSection = "";
    if (
      existingSkills &&
      options.highlightSkills &&
      options.highlightSkills.length > 0
    ) {
      // Add highlighted skills section to existing skills
      skillsSection =
        existingSkills +
        `\n\n**Key skills for ${
          options.targetJobTitle || "this role"
        }:**\n- ${options.highlightSkills.join("\n- ")}`;
    } else if (existingSkills) {
      skillsSection = existingSkills;
    } else if (options.highlightSkills && options.highlightSkills.length > 0) {
      skillsSection = `- ${options.highlightSkills.join("\n- ")}`;
    } else {
      skillsSection = `- Problem Solving
- Communication
- Teamwork
- Attention to Detail
- Project Management`;
    }

    // Determine which model is being used in the footer
    let modelInfo = "Content generated by Gemini 2.5 Pro";

    try {
      // Check recent console logs by looking at global variables that might exist
      let modelName = "unknown";

      // We can't access console logs directly, so we'll use the currentModelName if it exists
      // @ts-ignore - Accessing a variable that might exist globally
      if (typeof currentModelName !== "undefined") {
        // @ts-ignore
        modelName = currentModelName;
      }

      if (modelName.includes("2.0-flash")) {
        modelInfo = "Content generated by Gemini 2.0 Flash";
      } else if (modelName.includes("1.5-flash")) {
        modelInfo = "Content generated by Gemini 1.5 Flash";
      } else if (modelName.includes("1.5-pro")) {
        modelInfo = "Content generated by Gemini 1.5 Pro";
      } else if (modelName === "unknown") {
        modelInfo = "Content generated locally due to AI service limitations";
      }
    } catch (e) {
      // Ignore errors when trying to get model info
    }

    // Start constructing the tailored resume
    const tailoredResume = `# ${name} - ${
      options.targetJobTitle || "Professional"
    }

## Professional Summary
${targetedSummary}

## Skills
${skillsSection}

${
  existingExperience
    ? `## Professional Experience\n${existingExperience}`
    : `## Professional Experience
### Senior Role
#### Recent Company | 2020 - Present
- Achieved significant results relevant to ${
        options.targetJobTitle || "the target role"
      }
- Led key initiatives that improved efficiency by 25%
- Collaborated with cross-functional teams
- Implemented best practices in ${options.highlightSkills?.[0] || "the field"}

### Previous Role
#### Previous Company | 2018 - 2020
- Contributed to important projects
- Supported team objectives
- Developed valuable skills in ${
        options.highlightSkills?.[1] || "relevant areas"
      }
`
}

## Education
${
  originalResume.includes("## Education")
    ? originalResume.match(/## Education\s*\n([\s\S]+?)(?=##|$)/i)?.[1] ||
      "Bachelor's Degree in relevant field"
    : "Bachelor's Degree in relevant field"
}

## Additional Information
**Note: This is an example resume generated as a fallback when the AI service is unavailable.**
**It contains information from your original resume tailored to the job details you provided.**
**${modelInfo}**
`;

    console.log("[AI SERVICE] Successfully created example resume");
    return tailoredResume;
  } catch (error) {
    console.error("[AI SERVICE] Error creating example resume:", error);
    // Provide very basic fallback if parsing fails
    return `# Resume for ${options.targetJobTitle || "Job Application"}

## Professional Summary
Qualified professional seeking the ${
      options.targetJobTitle || "open position"
    } role at ${options.targetCompany || "your company"}.

## Skills
${
  options.highlightSkills
    ? "- " + options.highlightSkills.join("\n- ")
    : "- Relevant Skills"
}

## Professional Experience
### Professional Background
- Experience relevant to ${options.targetJobTitle || "this position"}
- Track record of success in previous roles
- Skills aligned with job requirements

## Note
This is a placeholder resume generated because the AI service is currently unavailable.
Please try again later for a fully tailored resume.
(Content generated locally)`;
  }
}

/**
 * Remove "Note:" sections from generated content
 */
function removeNoteSection(content: string): string {
  // Remove any lines containing "Note:" or entire Note sections
  return content
    .replace(
      /\*?Note:.*(?:\r?\n.*)*?(?:For better results|actual information|tailored to your|supplement the content).*/g,
      ""
    )
    .replace(
      /##?\s*Note\s*(?:\r?\n.*)*?(?:For better results|actual information|tailored to your|supplement the content).*/g,
      ""
    )
    .trim();
}

// Generate AI cover letter using Gemini
export const generateAICoverLetter = async (
  userId: string,
  options: CoverLetterGenerationOptions
): Promise<AIGeneratedContent> => {
  try {
    // Check if user has enough credits
    let hasCredits = true;

    // In development mode, skip credit check entirely
    if (import.meta.env.DEV) {
      console.log("[AI SERVICE] DEV MODE: Bypassing cover letter credit check");
    } else {
      hasCredits = await checkCreditBalance(userId, "cover_letter");
      if (!hasCredits) {
        throw new Error("Insufficient credits to generate cover letter");
      }
    }

    // Create a prompt for Gemini
    const prompt = `Generate a professional cover letter for a ${
      options.jobTitle || "job"
    } position at ${options.companyName || "the company"}.
    
Key experiences to highlight: ${
      options.highlightExperience?.join(", ") || "relevant experiences"
    }
Job description: ${options.jobDescription || "Not provided"}
Preferred tone: ${options.tone || "professional"}

The cover letter should:
1. Start with a proper greeting
2. Express enthusiasm for the position
3. Highlight relevant experiences and skills
4. Explain why the candidate is a good fit for the company
5. Include a call to action and professional closing
6. Be formatted in markdown`;

    // Call Gemini API
    const coverLetterContent = await generateWithGemini(prompt, {
      temperature: 0.7,
      systemPrompt:
        "You are an expert at writing compelling cover letters that help job seekers stand out. Format your response in markdown.",
    });

    // Save the generated content
    const contentData = await saveAIContent(
      userId,
      "cover_letter",
      `Cover Letter for ${options.companyName || "Job Application"}`,
      coverLetterContent,
      options.resumeId,
      options.jobApplicationId
    );

    // Use one credit
    if (import.meta.env.DEV) {
      console.log("[AI SERVICE] DEV MODE: Skipping cover letter credit usage");
    } else {
      await useCreditForFeature(userId, "cover_letter");
    }

    return contentData;
  } catch (error) {
    console.error("Error generating AI cover letter:", error);
    throw error;
  }
};

// Generate AI job recommendations using Gemini
export const generateJobRecommendations = async (
  userId: string,
  options: JobRecommendationOptions
): Promise<AIGeneratedContent> => {
  try {
    // Check if user has enough credits
    let hasCredits = true;

    // In development mode, skip credit check entirely
    if (import.meta.env.DEV) {
      console.log(
        "[AI SERVICE] DEV MODE: Bypassing job recommendations credit check"
      );
    } else {
      hasCredits = await checkCreditBalance(userId, "job_recommendation");
      if (!hasCredits) {
        throw new Error("Insufficient credits to generate job recommendations");
      }
    }

    // Create a prompt for Gemini
    const prompt = `Generate job recommendations for a professional with the following profile:
    
Current/Base job title: ${options.baseJobTitle || "Not specified"}
Desired location: ${options.desiredLocation || "Not specified"}
Preferred industries: ${
      options.preferredIndustries?.join(", ") || "Open to various industries"
    }
Key skills: ${options.skills?.join(", ") || "Not specified"}
Experience level: ${options.experienceLevel || "Not specified"}
Recent applications: ${
      options.recentApplications?.join(", ") || "None provided"
    }

For each job recommendation, include:
1. Job title
2. Company type/industry
3. Expected responsibilities
4. Required skills
5. Career growth opportunities
6. Estimated salary range
7. Type of company that would be a good cultural fit

Format the recommendations in markdown with clear sections and bullet points.`;

    // Call Gemini API
    const recommendationsContent = await generateWithGemini(prompt, {
      temperature: 0.8,
      maxTokens: 1500,
      systemPrompt:
        "You are a career coach and job market expert who provides personalized job recommendations based on a candidate's profile. Format your response in markdown.",
    });

    // Save the generated content
    const contentData = await saveAIContent(
      userId,
      "job_recommendation",
      `Job Recommendations for ${options.baseJobTitle || "Your Profile"}`,
      recommendationsContent
    );

    // Use one credit
    await useCreditForFeature(userId, "job_recommendation");

    return contentData;
  } catch (error) {
    console.error("Error generating job recommendations:", error);
    throw error;
  }
};

// Parse email for job application tracking using Gemini
export const parseEmailContent = async (
  userId: string,
  emailSubject: string,
  emailSender: string,
  emailContent: string
): Promise<{
  parsedCompany: string;
  parsedPosition: string;
  parsedDate: string;
  parsedStatus: boolean;
}> => {
  try {
    // Create a prompt for Gemini
    const prompt = `Analyze this job-related email and extract the following information:
    
Email Subject: ${emailSubject}
Email Sender: ${emailSender}
Email Content:
${emailContent}

Extract and return only the following information in a structured format:
1. Company name
2. Position/job title mentioned
3. Date mentioned (if any)
4. Is this email related to a job application status? (true/false)`;

    // Call Gemini API
    const parsedResult = await generateWithGemini(prompt, {
      temperature: 0.3,
      systemPrompt:
        "You are an expert at parsing job-related emails and extracting structured information. Only return the requested information in JSON format.",
    });

    // Parse the JSON from the response
    // Attempt to parse the result, but have a fallback pattern matching for safety
    let parsedData: {
      parsedCompany: string;
      parsedPosition: string;
      parsedDate: string;
      parsedStatus: boolean;
    };

    try {
      // Try to parse as JSON first
      parsedData = JSON.parse(parsedResult.replace(/```json|```/g, "").trim());
    } catch (error) {
      // Fallback to pattern matching if JSON parse fails
      const companyMatch = parsedResult.match(/Company name:?\s*([^\n]+)/i);
      const positionMatch = parsedResult.match(/Position:?\s*([^\n]+)/i);
      const dateMatch = parsedResult.match(/Date:?\s*([^\n]+)/i);
      const statusMatch = parsedResult.match(
        /related to.*?status:?\s*(true|false)/i
      );

      parsedData = {
        parsedCompany:
          companyMatch?.[1]?.trim() ||
          emailSender.split("@")[1]?.split(".")[0] ||
          "Unknown Company",
        parsedPosition: positionMatch?.[1]?.trim() || "Unknown Position",
        parsedDate: dateMatch?.[1]?.trim() || new Date().toISOString(),
        parsedStatus: statusMatch?.[1]?.toLowerCase() === "true",
      };
    }

    // Save the parsed email data
    await supabase.from("parsed_emails").insert([
      {
        user_id: userId,
        email_subject: emailSubject,
        email_sender: emailSender,
        email_content: emailContent,
        parsed_company: parsedData.parsedCompany,
        parsed_position: parsedData.parsedPosition,
        parsed_date: parsedData.parsedDate,
        parsed_status: parsedData.parsedStatus,
      },
    ]);

    return parsedData;
  } catch (error) {
    console.error("Error parsing email:", error);
    throw error;
  }
};
