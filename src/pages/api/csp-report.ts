import type { NextApiRequest, NextApiResponse } from "next";

type CSPReportResponse = {
  success: boolean;
  message?: string;
};

/**
 * API route handler for Content Security Policy violation reports
 * This endpoint receives and logs CSP violation reports sent by browsers
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CSPReportResponse>
) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    // Get the CSP report from the request
    const reportData = req.body["csp-report"] || req.body;

    // Log the CSP violation (in production you might want to store these in a database)
    console.log("CSP Violation:", JSON.stringify(reportData, null, 2));

    // Log to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      // Here you would typically send this to your logging service
      // For example: await logToMonitoringService(reportData);
    }

    // Return success
    res.status(204).end();
  } catch (error) {
    console.error("Error processing CSP report:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing CSP report",
    });
  }
}
