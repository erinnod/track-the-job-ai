# Console logs that should be removed for production

Below is a list of console logs found in the codebase that should be removed or replaced with proper error logging for production:

## src/pages/NotFound.tsx

- Line 10: `console.error(`

## src/lib/auth.ts

- Line 47: `console.error("Error creating profile:", profileError);`

## src/hooks/useProfileForm.ts

- Line 36: `console.error("Error getting user:", userError);`
- Line 48: `console.error("No user ID found");`
- Line 57: `console.log("Fetching profile for user ID:", userId);`
- Line 67: `console.error("Error fetching profile:", error);`
- Line 78: `console.log("No profile found, will create one on first save");`
- Line 79: `console.log("User metadata:", userData.user.user_metadata);`
- Line 91: `console.log("Profile data loaded:", data);`
- Line 105: `console.error("Exception fetching user data:", error);`
- Line 131: `console.error("Exception getting avatar URL:", error);`
- Line 161: `console.log("Attempting to upload file to avatars bucket...");`
- Line 170: `console.error("Error uploading file:", uploadError);`
- Line 202: `console.error("Error updating profile:", updateError);`
- Line 217: `console.error("Error uploading avatar:", error);`
- Line 232: `console.log("Saving personal data:", data);`
- Line 248: `console.log("Saving profile for user ID:", userId);`
- Line 261: `console.error("Error saving profile:", error);`
- Line 265: `console.log("Profile saved successfully");`
- Line 272: `console.error("Exception saving personal data:", error);`

## src/contexts/JobContext.tsx

- Line 60: `console.error("Error fetching jobs:", jobsError);`
- Line 83: `console.error("Error fetching contacts:", contactsError);`
- Line 94: `console.error("Error fetching notes:", notesError);`
- Line 105: `console.error("Error fetching events:", eventsError);`
- Line 160: `console.error("Exception fetching jobs:", error);`
- Line 222: `console.error("Error adding job:", error);`
- Line 245: `console.error("Error adding contacts:", contactsError);`
- Line 263: `console.error("Error adding notes:", notesError);`
- Line 283: `console.error("Error adding events:", eventsError);`
- Line 301: `console.error("Exception adding job:", error);`
- Line 354: `console.error("Error updating job:", error);`
- Line 368: `console.error("Error deleting existing contacts:", contactsDeleteError);`
- Line 379: `console.error("Error deleting existing notes:", notesDeleteError);`
- Line 390: `console.error("Error deleting existing events:", eventsDeleteError);`
- Line 411: `console.error("Error adding updated contacts:", contactsError);`
- Line 429: `console.error("Error adding updated notes:", notesError);`
- Line 449: `console.error("Error adding updated events:", eventsError);`
- Line 458: `console.error("Exception updating job:", error);`
- Line 482: `console.error("Error deleting contacts:", contactsDeleteError);`
- Line 493: `console.error("Error deleting notes:", notesDeleteError);`
- Line 504: `console.error("Error deleting events:", eventsDeleteError);`
- Line 515: `console.error("Error deleting job:", error);`
- Line 522: `console.error("Exception deleting job:", error);`

## src/contexts/AuthContext.tsx

- Line 42: `console.error("Error fetching user:", error);`
- Line 58: `console.error("Error signing out:", error);`

## src/components/settings/SecurityTab.tsx

- Line 54: `console.log("Saving security settings");`
- Line 74: `console.error("Error updating password:", error);`
- Line 91: `console.log("Setting two-factor authentication to:", enabled);`
- Line 102: `console.error("Error toggling 2FA:", error);`

## src/components/layout/Navbar.tsx

- Line 41: `console.error("Error fetching profile:", error);`
- Line 58: `console.error("Exception fetching avatar:", error);`
- Line 69: `console.log("User metadata for initials:", userMeta);`
- Line 88: `console.log("User metadata for display name:", userMeta);`

## src/components/settings/NotificationsTab.tsx

- Line 64: `console.error("Error fetching notification preferences:", error);`
- Line 78: `console.log("Saving notification preferences:", notifications);`
- Line 108: `console.error("Error saving notification preferences:", error);`

## src/components/settings/profile/ProfessionalForm.tsx

- Line 54: `console.error("Error getting user:", userError);`
- Line 66: `console.error("No user ID found");`
- Line 75: `console.log("Fetching professional details for user ID:", userId);`
- Line 83: `console.error(`
- Line 87: `console.log("Creating professional_details table might be needed");`
- Line 101: `console.error("Error fetching professional data:", error);`
- Line 113: `console.log(`
- Line 119: `console.log("Professional data loaded:", data);`
- Line 128: `console.error("Exception fetching professional data:", error);`
- Line 143: `console.log("Saving professional data:", data);`
- Line 159: `console.log("Saving professional details for user ID:", userId);`
- Line 182: `console.error("Error saving professional data:", error);`
- Line 186: `console.log("Professional details saved successfully");`
- Line 193: `console.error("Error saving professional data:", error);`

## Recommendations for handling console logs

1. **Error Logging**: Replace `console.error` with a proper error logging service for production.

   - Consider implementing a service that sends important errors to a monitoring system.
   - For development-only logs, wrap them in environment condition checks.

2. **Debug Logs**: Remove all `console.log` statements used for debugging before deploying to production.

3. **User Feedback**: Where appropriate, make sure error messages are shown to users via toast notifications instead of just logged to console.

4. **Environment-Based Logging**: If some logs are needed during development, use environment variables:

   ```typescript
   if (process.env.NODE_ENV === "development") {
     console.log("Debug info...");
   }
   ```

5. **Structured Logging**: Consider implementing a simple structured logging utility:
   ```typescript
   // In a logger.ts file
   export const logger = {
     error: (message: string, error?: any) => {
       if (process.env.NODE_ENV !== "production") {
         console.error(message, error);
       }
       // In production, send to error monitoring service
     },
     info: (message: string, data?: any) => {
       if (process.env.NODE_ENV !== "production") {
         console.log(message, data);
       }
     },
   };
   ```
