-- First, ensure we can recreate the descuentos_recomendados table if needed
DROP TABLE IF EXISTS descuentos_recomendados CASCADE;

-- Create descuentos_recomendados table
CREATE TABLE IF NOT EXISTS descuentos_recomendados (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  marca_combustible text NOT NULL,
  dias text[] NOT NULL,
  metodo_pago text NOT NULL,
  porcentaje_descuento integer NOT NULL,
  limite_reintegro integer NOT NULL,
  frecuencia text NOT NULL,
  url_fuente text,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  creado_el timestamptz DEFAULT now(),
  actualizado_el timestamptz DEFAULT now()
);

-- Enable RLS on descuentos_recomendados
ALTER TABLE descuentos_recomendados ENABLE ROW LEVEL SECURITY;

-- Create policies for descuentos_recomendados
DROP POLICY IF EXISTS "Permitir insertar recomendaciones" ON descuentos_recomendados;
DROP POLICY IF EXISTS "Permitir ver recomendaciones" ON descuentos_recomendados;

CREATE POLICY "Permitir insertar recomendaciones"
  ON descuentos_recomendados
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Permitir ver recomendaciones"
  ON descuentos_recomendados
  FOR SELECT
  TO public
  USING (true);

-- Update estado check constraint
ALTER TABLE descuentos_recomendados DROP CONSTRAINT IF EXISTS recommended_discounts_status_check;
ALTER TABLE descuentos_recomendados ADD CONSTRAINT descuentos_recomendados_estado_check 
  CHECK (estado IN ('pendiente', 'aprobado', 'rechazado'));

-- Rename and update recommended_discounts table
ALTER TABLE IF EXISTS recommended_discounts RENAME TO descuentos_recomendados;

-- Rename columns in descuentos_recomendados
ALTER TABLE descuentos_recomendados RENAME COLUMN fuel_brand TO marca_combustible;
ALTER TABLE descuentos_recomendados RENAME COLUMN days TO dias;
ALTER TABLE descuentos_recomendados RENAME COLUMN payment_method TO metodo_pago;
ALTER TABLE descuentos_recomendados RENAME COLUMN discount_percentage TO porcentaje_descuento;
ALTER TABLE descuentos_recomendados RENAME COLUMN reimbursement_limit TO limite_reintegro;
ALTER TABLE descuentos_recomendados RENAME COLUMN frequency TO frecuencia;
ALTER TABLE descuentos_recomendados RENAME COLUMN source_url TO url_fuente;
ALTER TABLE descuentos_recomendados RENAME COLUMN status TO estado;
ALTER TABLE descuentos_recomendados RENAME COLUMN created_at TO creado_el;
ALTER TABLE descuentos_recomendados RENAME COLUMN updated_at TO actualizado_el; 