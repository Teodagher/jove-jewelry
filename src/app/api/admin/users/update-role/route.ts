import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Role, ROLES, isFullAdmin } from '@/lib/roles'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

// Valid roles that can be assigned
const ASSIGNABLE_ROLES: Role[] = ['admin', 'admin_designer', 'customer'];

interface UpdateRoleRequest {
  userId: string;
  action: 'add_role' | 'remove_role' | 'promote' | 'demote'; // promote/demote for backwards compat
  role?: Role;
}

export async function POST(request: Request) {
  try {
    // Verify caller is admin
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Check caller's admin role (must be full admin to manage roles)
    const { data: callerData, error: callerError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('auth_user_id', user.id)
      .single();

    if (callerError || !callerData?.roles || !isFullAdmin(callerData.roles)) {
      return NextResponse.json({ error: 'Forbidden - only full admins can manage roles' }, { status: 403 });
    }

    const { userId, action, role } = await request.json() as UpdateRoleRequest;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Handle legacy promote/demote actions
    if (action === 'promote') {
      return handleRoleChange(supabaseAdmin, userId, 'add_role', 'admin');
    }
    if (action === 'demote') {
      return handleRoleChange(supabaseAdmin, userId, 'remove_role', 'admin');
    }

    // Handle new add_role/remove_role actions
    if (!['add_role', 'remove_role'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Use add_role, remove_role, promote, or demote.' 
      }, { status: 400 });
    }

    if (!role || !ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json({ 
        error: `Invalid role. Must be one of: ${ASSIGNABLE_ROLES.join(', ')}` 
      }, { status: 400 });
    }

    return handleRoleChange(supabaseAdmin, userId, action, role);
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

async function handleRoleChange(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  userId: string,
  action: 'add_role' | 'remove_role',
  role: Role
) {
  // Fetch target user
  const { data: targetUser, error: targetError } = await supabaseAdmin
    .from('users')
    .select('id, roles, email')
    .eq('id', userId)
    .single();

  if (targetError || !targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const currentRoles: string[] = targetUser.roles || [];

  if (action === 'add_role') {
    if (currentRoles.includes(role)) {
      return NextResponse.json({ 
        message: `User already has ${ROLES[role].displayName} role`, 
        roles: currentRoles 
      });
    }
    
    const newRoles = [...currentRoles, role];
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ roles: newRoles })
      .eq('id', userId);

    if (updateError) throw updateError;
    return NextResponse.json({ success: true, roles: newRoles });
  }

  if (action === 'remove_role') {
    if (!currentRoles.includes(role)) {
      return NextResponse.json({ 
        message: `User does not have ${ROLES[role].displayName} role`, 
        roles: currentRoles 
      });
    }

    // Prevent removing the last admin
    if (role === 'admin') {
      const { data: allAdmins, error: adminsError } = await supabaseAdmin
        .from('users')
        .select('id')
        .contains('roles', ['admin']);

      if (adminsError) throw adminsError;

      if (!allAdmins || allAdmins.length <= 1) {
        return NextResponse.json({ 
          error: 'Cannot remove the last admin' 
        }, { status: 400 });
      }
    }

    const newRoles = currentRoles.filter((r: string) => r !== role);
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ roles: newRoles })
      .eq('id', userId);

    if (updateError) throw updateError;
    return NextResponse.json({ success: true, roles: newRoles });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
