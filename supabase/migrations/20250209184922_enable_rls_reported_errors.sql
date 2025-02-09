-- Enable RLS
ALTER TABLE reported_errors ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (reading)
CREATE POLICY "Admin can view reports" ON reported_errors
FOR SELECT
TO authenticated
USING (auth.uid() IN (
  SELECT id FROM auth.users 
  WHERE email = 'juanotero@gmail.com' -- Replace with your email
));

-- Create policy for admin access (inserting)
CREATE POLICY "Admin can insert reports" ON reported_errors
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IN (
  SELECT id FROM auth.users 
  WHERE email = 'juanotero@gmail.com' -- Replace with your email
));

-- Create policy for admin access (updating)
CREATE POLICY "Admin can update reports" ON reported_errors
FOR UPDATE
TO authenticated
USING (auth.uid() IN (
  SELECT id FROM auth.users 
  WHERE email = 'juanotero@gmail.com' -- Replace with your email
))
WITH CHECK (auth.uid() IN (
  SELECT id FROM auth.users 
  WHERE email = 'juanotero@gmail.com' -- Replace with your email
));

-- Create policy for admin access (deleting)
CREATE POLICY "Admin can delete reports" ON reported_errors
FOR DELETE
TO authenticated
USING (auth.uid() IN (
  SELECT id FROM auth.users 
  WHERE email = 'juanotero@gmail.com' -- Replace with your email
));
