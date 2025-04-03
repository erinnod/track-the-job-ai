import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { syncAllIntegrations } from "@/services/integrationService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get the user from the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Trigger the sync process
    const result = await syncAllIntegrations(session.user.id);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error syncing integrations:", error);
    return res.status(500).json({
      success: false,
      imported: 0,
      message: "Failed to sync integrations",
    });
  }
}
