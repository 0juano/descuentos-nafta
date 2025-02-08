/*
  # Create Fuel Discounts Schema

  1. New Tables
    - `discounts`
      - `id` (text, primary key) - Unique identifier for each discount
      - `fuel_brand` (text) - Brand offering the discount (YPF, SHELL, AXION, Multiple)
      - `day` (text) - Day(s) when discount is applicable
      - `card_method` (text) - Payment method required for discount
      - `discount` (integer) - Discount percentage
      - `spending_limit` (integer) - Maximum spending amount
      - `reimbursement_limit` (integer) - Maximum reimbursement amount
      - `frequency` (text) - Frequency of the discount (Weekly, Monthly, etc.)
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `discounts` table
    - Add policies for public read access
    - Add policies for authenticated users to manage discounts
*/

-- Create discounts table
CREATE TABLE IF NOT EXISTS discounts (
  id text PRIMARY KEY,
  fuel_brand text NOT NULL,
  day text NOT NULL,
  card_method text NOT NULL,
  discount integer NOT NULL,
  spending_limit integer NOT NULL,
  reimbursement_limit integer NOT NULL,
  frequency text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access"
  ON discounts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage discounts"
  ON discounts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_discounts_updated_at
  BEFORE UPDATE ON discounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();