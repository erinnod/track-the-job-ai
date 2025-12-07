import { logger } from "@/utils/logger";

// No longer need the API key from environment variables as it will be handled by the server
// const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// For security, we no longer need to handle API key handling in the client
const getRedactedKeyInfo = () => {
  return "USING_SERVER_PROXY";
};

// Define the server proxy endpoints
const SERVER_PROXY_URL = "/api/ai/gemini";
const FALLBACK_PROXY_URL = "/api/ai/gemini/fallback";

// Track which model we're currently using for logging purposes
let currentModelName = "gemini-2.5-pro-preview";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second delay between retries

// Interface for Gemini request
interface GeminiRequestContent {
  parts: {
    text: string;
  }[];
}

interface GeminiRequest {
  contents: GeminiRequestContent[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
}

// Interface for Gemini response
interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
    finishReason: string;
  }[];
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: {
      category: string;
      probability: string;
    }[];
  };
}

// Interface for our server proxy response
interface ProxyResponse {
  success: boolean;
  data?: GeminiResponse;
  error?: any;
  message?: string;
  model?: string;
}

/**
 * Helper function to wait for a specified time
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Makes an API call to Gemini API through our server proxy with retry logic and fallback
 * @param prompt The prompt to send to Gemini
 * @param options Optional configuration for the generation
 * @returns The generated text from Gemini
 */
export async function generateWithGemini(
  prompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    retries?: number;
  } = {}
): Promise<string> {
  // Number of retries to attempt
  const maxRetries = options.retries || MAX_RETRIES;
  let retryCount = 0;
  let lastError: Error | null = null;
  let useFallbackModel = false; // Track if we should use fallback endpoint

  // Get authentication token from Supabase session if available
  let authToken = "";
  try {
    // Try to get token from localStorage (where Supabase stores it)
    const supabaseSession = localStorage.getItem(
      "sb-kffbwemulhhsyaiooabh-auth-token"
    );
    if (supabaseSession) {
      const parsedSession = JSON.parse(supabaseSession);
      if (parsedSession?.access_token) {
        authToken = parsedSession.access_token;
      }
    }
  } catch (error) {
    console.warn("[GEMINI] Failed to retrieve auth token:", error);
  }

  // We'll try our primary model and then fallbacks if needed
  while (retryCount <= maxRetries) {
    try {
      if (retryCount > 0) {
        console.log(`[GEMINI] Retry attempt ${retryCount} of ${maxRetries}`);
        // Wait before retrying with exponential backoff
        await wait(RETRY_DELAY * Math.pow(2, retryCount - 1));

        // Check if we should try a fallback model due to rate limits
        if (
          lastError &&
          (lastError.message.includes("quota") ||
            lastError.message.includes("rate limit") ||
            lastError.message.includes("resource exhausted"))
        ) {
          useFallbackModel = true;
          console.log(
            `[GEMINI] Switching to fallback model due to rate limits`
          );
        }
      }

      console.log(
        `[GEMINI] Generating with ${
          useFallbackModel ? "fallback model" : currentModelName
        }. Prompt length:`,
        prompt.length
      );
      console.log("[GEMINI] Prompt first 100 chars:", prompt.substring(0, 100));
      console.log("[GEMINI] Temperature:", options.temperature);
      console.log("[GEMINI] Max tokens:", options.maxTokens);

      // Prepare the request body for our server proxy
      const requestBody = {
        prompt,
        model: useFallbackModel ? undefined : "gemini-2.5-pro-preview-05-06",
        options: {
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 1024,
          systemPrompt: options.systemPrompt,
        },
      };

      // Determine which endpoint to use
      const proxyUrl = useFallbackModel ? FALLBACK_PROXY_URL : SERVER_PROXY_URL;

      console.log(
        `[GEMINI] Sending request to server proxy... ${
          retryCount > 0 ? "(Retry #" + retryCount + ")" : ""
        }`
      );

      // Add a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      try {
        console.log(`[GEMINI] Calling server proxy: ${proxyUrl}`);

        // Make the request to our server proxy with the auth token from Supabase
        const response = await fetch(proxyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authToken ? `Bearer ${authToken}` : "",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        // Clear the timeout since the request completed
        clearTimeout(timeoutId);

        console.log("[GEMINI] API response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[GEMINI] Server proxy error:", errorText);
          logger.error("[GEMINI] Server proxy error:", {
            status: response.status,
            text: errorText,
          });

          // Parse the error response if it's JSON
          let errorMessage = `Server proxy error: ${response.status}`;
          try {
            const errorJson = JSON.parse(errorText);

            if (errorJson.message) {
              errorMessage = errorJson.message;
            }

            // Check for quota errors to trigger fallback
            if (
              errorMessage.includes("quota") ||
              errorMessage.includes("rate limit") ||
              errorMessage.includes("resource exhausted")
            ) {
              if (!useFallbackModel) {
                useFallbackModel = true;
                console.log(
                  "[GEMINI] Rate limit detected - switching to fallback model"
                );
                continue; // Skip to next retry immediately with fallback
              }
            }
          } catch (e) {
            // If parsing fails, use the raw error text
            console.error("[GEMINI] Failed to parse error JSON:", e);
            errorMessage = `Server proxy error: ${response.status} - ${errorText}`;
          }

          throw new Error(errorMessage);
        }

        const proxyResponse = (await response.json()) as ProxyResponse;

        if (!proxyResponse.success) {
          console.error(
            "[GEMINI] Server proxy returned error:",
            proxyResponse.message
          );
          throw new Error(proxyResponse.message || "Server proxy error");
        }

        // Update the model used for reference
        if (proxyResponse.model) {
          currentModelName = proxyResponse.model;
        }

        const data = proxyResponse.data as GeminiResponse;
        console.log("[GEMINI] API response received successfully");

        // Check if content was blocked for safety reasons
        if (data.promptFeedback?.blockReason) {
          console.warn("[GEMINI] Content blocked:", data.promptFeedback);
          logger.warn("[GEMINI] Content blocked:", data.promptFeedback);
          throw new Error(
            `Content was blocked. Reason: ${data.promptFeedback.blockReason}`
          );
        }

        // Check if we have valid candidates
        if (!data.candidates || data.candidates.length === 0) {
          console.error("[GEMINI] No candidates in response");
          throw new Error("No response generated from Gemini");
        }

        // Extract the generated text from the first candidate
        const generatedText = data.candidates[0].content.parts[0].text;
        console.log(
          "[GEMINI] Successfully generated text. Length:",
          generatedText.length
        );
        console.log(
          "[GEMINI] First 100 characters of response:",
          generatedText.substring(0, 100)
        );

        // Add a success message showing which model was used
        console.log(
          `[GEMINI] Successfully generated with model: ${currentModelName}`
        );

        return generatedText;
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          console.error("[GEMINI] Request timed out after 60 seconds");
          throw new Error("Request timed out after 60 seconds");
        }
        throw fetchError;
      }
    } catch (error) {
      console.error(
        `[GEMINI] Error on attempt ${retryCount + 1}/${maxRetries + 1}:`,
        error
      );
      logger.error("[GEMINI] Error calling server proxy:", error);
      lastError = error instanceof Error ? error : new Error(String(error));

      // Only retry on network errors, 5xx server errors, or rate limits
      const isNetworkError =
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("Network request failed");
      const isServerError =
        error.message.includes("500") ||
        error.message.includes("502") ||
        error.message.includes("503") ||
        error.message.includes("504");
      const isRateLimitError =
        error.message.includes("quota") ||
        error.message.includes("RESOURCE_EXHAUSTED") ||
        error.message.includes("rate limit");

      // If it's a rate limit error, try a fallback model
      if (isRateLimitError && !useFallbackModel) {
        useFallbackModel = true;
        console.log(`[GEMINI] Rate limit hit. Switching to fallback model`);
        continue; // Skip to the next iteration immediately
      }

      // If it's not a retryable error and we've tried fallbacks, throw immediately
      if (
        !isNetworkError &&
        !isServerError &&
        !isRateLimitError &&
        useFallbackModel
      ) {
        throw error;
      }

      retryCount++;

      // If we've exhausted all retries, throw the last error
      if (retryCount > maxRetries) {
        console.error(`[GEMINI] All ${maxRetries} retry attempts failed`);
        throw lastError;
      }
    }
  }

  // This should never be reached because of the throw in the loop above
  throw lastError || new Error("Unknown error occurred");
}
