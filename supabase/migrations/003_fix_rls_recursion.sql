-- ============================================
-- FIX: RLS infinite recursion on profiles table
-- Coller dans SQL Editor Supabase
-- https://supabase.com/dashboard/project/fjzzylksthpnunrqazdg/sql/new
-- ============================================

-- 1. Create a SECURITY DEFINER function to check admin status
--    This bypasses RLS so it doesn't cause infinite recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Drop all existing profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;

-- 3. Recreate policies using is_admin() to avoid recursion
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "System can insert profiles" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Also fix other tables that have the same recursion pattern
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (active = true OR is_admin());
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage invoice settings" ON invoice_settings;
CREATE POLICY "Admins can manage invoice settings" ON invoice_settings
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage class types" ON class_types;
CREATE POLICY "Admins can manage class types" ON class_types
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage class sessions" ON class_sessions;
CREATE POLICY "Admins can manage class sessions" ON class_sessions
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all bookings" ON class_bookings;
CREATE POLICY "Admins can view all bookings" ON class_bookings
  FOR SELECT USING (is_admin());

SELECT 'RLS recursion fix applied! ✓';
