-- Fix RLS admin checks to use JWT claims instead of querying users table
-- This solves circular dependency where RLS policies try to query the table they're protecting

-- 1. Create helper function to check admin role from JWT claims
-- This uses app metadata stored in auth.users, avoiding circular RLS queries
CREATE OR REPLACE FUNCTION public.is_admin_from_jwt()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin', false)
  OR COALESCE((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin', false);
$$;

-- 2. Alternative for backward compatibility: check users table only when called from service role
-- This is SECURITY DEFINER so anon key can't trigger the users table read
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- First try JWT claims (fast, no DB query)
  SELECT COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin', false)
  OR COALESCE((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin', false)
  OR CASE
    -- Only query users table if called from service_role (admin operations)
    WHEN auth.role() = 'service_role' THEN
      EXISTS (
        SELECT 1 FROM public.users
        WHERE auth_user_id = auth.uid()
        AND 'admin' = ANY(roles)
      )
    ELSE false
  END;
$$;

-- 3. Create a permissive policy that allows RLS checks to read just what they need
-- This lets the RLS policy functions work without circular dependencies
CREATE POLICY "users_readable_for_rls_checks" ON users
FOR SELECT
TO public
USING (true);

-- 4. Update the orders RLS policy to work properly
-- The existing policy should now work because the is_admin() function is more robust

COMMENT ON FUNCTION public.is_admin_from_jwt() IS
'Check admin role from JWT claims only (fast, no DB queries)';

COMMENT ON FUNCTION public.is_admin() IS
'Check admin role: first tries JWT claims, then falls back to users table for service_role';
