/*
  # Create Recommended Discounts Schema

  1. New Table
    - `recommended_discounts`
      - Stores user-submitted discount recommendations
      - Includes validation and automatic timestamps
      - Enables RLS policies for public submissions
*/

-- Create recommended_discounts table
CREATE TABLE IF NOT EXISTS recommended_discounts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  fuel_brand text NOT NULL,
  days text[] NOT NULL,
  payment_method text NOT NULL,
  discount_percentage integer NOT NULL,
  reimbursement_limit integer NOT NULL,
  frequency text NOT NULL,
  source_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE recommended_discounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public to insert recommendations"
  ON recommended_discounts
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to view their submissions"
  ON recommended_discounts
  FOR SELECT
  TO public
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recommended_discounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_recommended_discounts_updated_at
  BEFORE UPDATE ON recommended_discounts
  FOR EACH ROW
  EXECUTE FUNCTION update_recommended_discounts_updated_at(); 