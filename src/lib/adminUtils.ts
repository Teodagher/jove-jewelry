import { supabase } from '@/lib/supabase/client';

/**
 * Utility functions for admin management
 */

export interface User {
  id: string;
  auth_user_id: string | null;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  country: string | null;
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

    const { data: userData, error } = await (supabase as any)
      .from('users')
      .select('roles')
      .eq('auth_user_id', session.user.id)
      .single();

    if (error || !userData) {
      return false;
    }

    return (userData as any)?.roles?.includes('admin') || false;
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
export async function promoteToAdmin(userId: string, role: 'admin' | 'admin_designer' = 'admin'): Promise<boolean> {
  try {
    const { data, error } = await (supabase as any)
      .from('users')
      .select('roles')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    const currentRoles = (data as any).roles || [];
    if (currentRoles.includes(role)) {
      return true; // Already has the role
    }

    const newRoles = [...currentRoles, role];

    const { error: updateError } = await (supabase as any)
      .from('users')
      .update({ roles: newRoles })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return true;
  } catch (error) {
    console.error(`Error promoting user to ${role}:`, error);
    throw error;
  }
}

/**
 * Remove admin role from user (admin only)
 */
export async function removeAdminRole(userId: string, role: 'admin' | 'admin_designer' = 'admin'): Promise<boolean> {
  try {
    const { data, error } = await (supabase as any)
      .from('users')
      .select('roles')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    const currentRoles = (data as any).roles || [];
    const newRoles = currentRoles.filter((r: string) => r !== role);

    const { error: updateError } = await (supabase as any)
      .from('users')
      .update({ roles: newRoles })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return true;
  } catch (error) {
    console.error(`Error removing ${role} role:`, error);
    throw error;
  }
}

/**
 * Create a new admin user (for initial setup)
 */
export async function createAdminUser(email: string, password: string, fullName?: string, role: 'admin' | 'admin_designer' = 'admin'): Promise<boolean> {
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
      // Now we need to promote them to the specified role
      await promoteToAdmin(authData.user.id, role);
    }

    return true;
  } catch (error) {
    console.error(`Error creating ${role} user:`, error);
    throw error;
  }
}
