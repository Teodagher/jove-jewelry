-- Simplify is_admin() to avoid circular RLS dependency
-- The key insight: When called from a RLS policy, SECURITY DEFINER allows
-- the function to read the users table even if the policy would normally block it

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Check if current user has admin role in the users table
  -- SECURITY DEFINER means this function can read users table even in RLS context
  SELECT COALESCE(
    (SELECT 'admin' = ANY(roles) FROM public.users WHERE auth_user_id = auth.uid()),
    false
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS
'Check if current user has admin role. Uses SECURITY DEFINER so it can safely query users table in RLS policies.';
