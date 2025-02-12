-- Drop only descuentos_recomendados table
DROP TABLE IF EXISTS descuentos_recomendados CASCADE;

-- Make sure we keep only the tables we want
-- If they don't exist, create them with the correct structure

-- 1. descuentos table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS descuentos (
  id text PRIMARY KEY,
  marca_combustible text NOT NULL,
  dia text NOT NULL,
  metodo_pago text NOT NULL,
  descuento integer NOT NULL,
  limite_gasto integer NOT NULL,
  limite_reintegro integer NOT NULL,
  frecuencia text NOT NULL,
  creado_el timestamptz DEFAULT now(),
  actualizado_el timestamptz DEFAULT now()
);

-- 2. recommended_discounts table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS recommended_discounts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  fuel_brand text,
  days text[],
  payment_method text,
  discount_percentage integer,
  reimbursement_limit integer,
  frequency text,
  source_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Add constraint to ensure at least one field is not null
  CONSTRAINT at_least_one_field_required CHECK (
    fuel_brand IS NOT NULL OR 
    days IS NOT NULL OR 
    payment_method IS NOT NULL OR 
    discount_percentage IS NOT NULL OR 
    reimbursement_limit IS NOT NULL OR 
    frequency IS NOT NULL
  )
);

-- 3. reported_errors table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS reported_errors (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  discount_id text REFERENCES descuentos(id),
  is_discontinued boolean NOT NULL,
  days_error boolean,
  discount_error boolean,
  reimbursement_error boolean,
  frequency_error boolean,
  suggested_days text[],
  suggested_discount integer,
  suggested_reimbursement integer,
  suggested_frequency text,
  evidence_url text,
  comments text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE descuentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommended_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_errors ENABLE ROW LEVEL SECURITY;

-- Create or update policies
DROP POLICY IF EXISTS "Permitir acceso público de lectura" ON descuentos;
CREATE POLICY "Permitir acceso público de lectura"
  ON descuentos
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow public to insert recommendations" ON recommended_discounts;
CREATE POLICY "Allow public to insert recommendations"
  ON recommended_discounts
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public to view recommendations" ON recommended_discounts;
CREATE POLICY "Allow public to view recommendations"
  ON recommended_discounts
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow public to report errors" ON reported_errors;
CREATE POLICY "Allow public to report errors"
  ON reported_errors
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public to view their reports" ON reported_errors;
CREATE POLICY "Allow public to view their reports"
  ON reported_errors
  FOR SELECT
  TO public
  USING (true); 