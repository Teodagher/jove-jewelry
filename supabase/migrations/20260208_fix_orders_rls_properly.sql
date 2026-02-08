-- Fix orders RLS to avoid circular user table queries
-- The issue: orders_select_own_or_admin policy has subqueries that try to read users table

-- Drop the problematic policy
DROP POLICY IF EXISTS "orders_select_own_or_admin" ON orders;

-- Create new policy that avoids circular user table reads
-- Use is_admin() which now safely checks JWT + falls back to service_role check
CREATE POLICY "orders_select_own_or_admin" ON orders
FOR SELECT
TO public
USING (
  is_admin()  -- Check JWT claims first (fast), falls back for service_role
  OR (auth.role() = 'service_role'::text)  -- Allow service role direct access
  OR (auth_user_id = auth.uid())  -- Allow users to see their own orders
  OR (customer_email = current_setting('app.current_user_email', true))  -- Allow by email if set
);

COMMENT ON POLICY "orders_select_own_or_admin" ON orders IS
'Allow: admin (via JWT or service_role), own orders by auth_user_id, or by matching email';
