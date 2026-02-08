import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
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

    // Check caller's admin role
    const { data: callerData, error: callerError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('auth_user_id', user.id)
      .single();

    if (callerError || !callerData?.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, action } = await request.json() as { userId: string; action: 'promote' | 'demote' };

    if (!userId || !['promote', 'demote'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request. Provide userId and action (promote/demote).' }, { status: 400 });
    }

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

    if (action === 'promote') {
      if (currentRoles.includes('admin')) {
        return NextResponse.json({ message: 'User is already an admin', roles: currentRoles });
      }
      const newRoles = [...currentRoles, 'admin'];
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ roles: newRoles })
        .eq('id', userId);

      if (updateError) throw updateError;
      return NextResponse.json({ success: true, roles: newRoles });
    }

    if (action === 'demote') {
      if (!currentRoles.includes('admin')) {
        return NextResponse.json({ message: 'User is not an admin', roles: currentRoles });
      }

      // Prevent removing the last admin
      const { data: allAdmins, error: adminsError } = await supabaseAdmin
        .from('users')
        .select('id')
        .contains('roles', ['admin']);

      if (adminsError) throw adminsError;

      if (!allAdmins || allAdmins.length <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 400 });
      }

      const newRoles = currentRoles.filter((r: string) => r !== 'admin');
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ roles: newRoles })
        .eq('id', userId);

      if (updateError) throw updateError;
      return NextResponse.json({ success: true, roles: newRoles });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
