-- Drop existing policies
DROP POLICY IF EXISTS "Admin can view reports" ON reported_errors;
DROP POLICY IF EXISTS "Admin can insert reports" ON reported_errors;
DROP POLICY IF EXISTS "Admin can update reports" ON reported_errors;
DROP POLICY IF EXISTS "Admin can delete reports" ON reported_errors;

-- Fix the discount_id column type
ALTER TABLE reported_errors ALTER COLUMN discount_id TYPE text;

-- Create new policies
-- Allow admin to view all reports
CREATE POLICY "Admin can view reports" ON reported_errors
FOR SELECT TO authenticated
USING (auth.uid() IN (
  SELECT id FROM auth.users 
  WHERE email = 'juanotero@gmail.com'
));

-- Allow anyone to insert reports
CREATE POLICY "Anyone can insert reports" ON reported_errors
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Allow admin to update reports
CREATE POLICY "Admin can update reports" ON reported_errors
FOR UPDATE TO authenticated
USING (auth.uid() IN (
  SELECT id FROM auth.users 
  WHERE email = 'juanotero@gmail.com'
));

-- Allow admin to delete reports
CREATE POLICY "Admin can delete reports" ON reported_errors
FOR DELETE TO authenticated
USING (auth.uid() IN (
  SELECT id FROM auth.users 
  WHERE email = 'juanotero@gmail.com'
));
