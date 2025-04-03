import { supabase } from "./supabase";

// Type for registration data
export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Sign up a new user with email and password
 * Also creates a profile entry in the profiles table
 */
export async function signUp(data: SignUpData) {
  const { email, password, firstName, lastName } = data;

  try {
    // Step 1: Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Add additional user metadata if needed
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) {
      throw authError;
    }

    // Step 2: Create a profile entry if sign up was successful
    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Consider handling this error, possibly by deleting the auth user
      }
    }

    return { success: true, user: authData.user };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An error occurred during sign up",
    };
  }
}

/**
 * Sign in a user with email and password
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { success: true, user: data.user };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An error occurred during sign in",
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An error occurred during sign out",
    };
  }
}

/**
 * Get the current logged in user
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, user: null };
  }
}

/**
 * Reset password - sends password reset email
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An error occurred sending reset password email",
    };
  }
}

/**
 * Update user password with validation to prevent setting the same password
 */
export async function updatePassword(password: string) {
  try {
    // First try to get the user
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!userData.user || !userData.user.email) {
      throw new Error("User not found or email not available");
    }

    // Check if the new password is the same as the current password
    // by attempting to sign in with the new password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password,
    });

    // If sign-in succeeds (no error), it means the password is the same as current
    if (!signInError) {
      return {
        success: false,
        error: "New password cannot be the same as your current password",
      };
    }

    // If we get here, the password is different, so we can update it
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An error occurred updating password",
    };
  }
}
