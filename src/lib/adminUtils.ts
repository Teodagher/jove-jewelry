import { supabase } from '@/lib/supabase';

/**
 * Utility functions for admin management
 */

export interface User {
  id: string;
  auth_user_id: string | null;
  email: string;
  full_name: string | null;
  roles: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Check if current user has admin role
 */
export async function checkAdminRole(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return false;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('roles')
      .eq('auth_user_id', session.user.id)
      .single();

    if (error || !userData) {
      return false;
    }

    return userData.roles?.includes('admin') || false;
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Promote user to admin (admin only)
 */
export async function promoteToAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('roles')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    const currentRoles = data.roles || [];
    if (currentRoles.includes('admin')) {
      return true; // Already an admin
    }

    const newRoles = [...currentRoles, 'admin'];

    const { error: updateError } = await supabase
      .from('users')
      .update({ roles: newRoles })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return true;
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    throw error;
  }
}

/**
 * Remove admin role from user (admin only)
 */
export async function removeAdminRole(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('roles')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    const currentRoles = data.roles || [];
    const newRoles = currentRoles.filter((role: string) => role !== 'admin');

    const { error: updateError } = await supabase
      .from('users')
      .update({ roles: newRoles })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return true;
  } catch (error) {
    console.error('Error removing admin role:', error);
    throw error;
  }
}

/**
 * Create a new admin user (for initial setup)
 */
export async function createAdminUser(email: string, password: string, fullName?: string): Promise<boolean> {
  try {
    // This should be called from a secure context (server-side or admin panel)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email
        }
      }
    });

    if (authError) {
      throw authError;
    }

    if (authData.user) {
      // The trigger will create the user record automatically
      // Now we need to promote them to admin
      await promoteToAdmin(authData.user.id);
    }

    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}
