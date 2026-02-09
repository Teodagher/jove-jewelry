-- Add support for admin_designer role
-- This role has limited admin access (design, content, media only)

-- Update is_admin() to also recognize admin_designer for basic admin panel access
-- Note: This function is used for basic admin panel access checks
-- More granular permissions are handled in the application layer

CREATE OR REPLACE FUNCTION public.has_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Check if current user has any admin-level role (admin or admin_designer)
  SELECT COALESCE(
    (SELECT 'admin' = ANY(roles) OR 'admin_designer' = ANY(roles) 
     FROM public.users 
     WHERE auth_user_id = auth.uid()),
    false
  );
$$;

COMMENT ON FUNCTION public.has_admin_access() IS
'Check if current user has any admin-level access (admin or admin_designer roles).';

-- Keep existing is_admin() for full admin checks (e.g., user management, orders, financial)
-- It already checks for 'admin' role specifically

-- Create a helper function to check for specific roles
CREATE OR REPLACE FUNCTION public.has_role(role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role_name = ANY(roles) 
     FROM public.users 
     WHERE auth_user_id = auth.uid()),
    false
  );
$$;

COMMENT ON FUNCTION public.has_role(text) IS
'Check if current user has a specific role.';
