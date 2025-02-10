/*
  # Migración a Español

  1. Renombrar Tablas
    - `discounts` -> `descuentos`
    - `reported_errors` -> `errores_reportados`

  2. Renombrar Columnas en `descuentos`
    - `fuel_brand` -> `marca_combustible`
    - `day` -> `dia`
    - `card_method` -> `metodo_pago`
    - `discount` -> `descuento`
    - `spending_limit` -> `limite_gasto`
    - `reimbursement_limit` -> `limite_reintegro`
    - `frequency` -> `frecuencia`
    - `created_at` -> `creado_el`
    - `updated_at` -> `actualizado_el`

  3. Renombrar Columnas en `errores_reportados`
    - `discount_id` -> `id_descuento`
    - `is_discontinued` -> `esta_discontinuado`
    - `days_error` -> `error_dias`
    - `discount_error` -> `error_descuento`
    - `reimbursement_error` -> `error_reintegro`
    - `frequency_error` -> `error_frecuencia`
    - `suggested_days` -> `dias_sugeridos`
    - `suggested_discount` -> `descuento_sugerido`
    - `suggested_reimbursement` -> `reintegro_sugerido`
    - `suggested_frequency` -> `frecuencia_sugerida`
    - `evidence_url` -> `url_evidencia`
    - `comments` -> `comentarios`
    - `created_at` -> `creado_el`
    - `updated_at` -> `actualizado_el`
*/

-- Renombrar tablas
ALTER TABLE IF EXISTS discounts RENAME TO descuentos;
ALTER TABLE IF EXISTS reported_errors RENAME TO errores_reportados;

-- Renombrar columnas en descuentos
ALTER TABLE descuentos RENAME COLUMN fuel_brand TO marca_combustible;
ALTER TABLE descuentos RENAME COLUMN day TO dia;
ALTER TABLE descuentos RENAME COLUMN card_method TO metodo_pago;
ALTER TABLE descuentos RENAME COLUMN discount TO descuento;
ALTER TABLE descuentos RENAME COLUMN spending_limit TO limite_gasto;
ALTER TABLE descuentos RENAME COLUMN reimbursement_limit TO limite_reintegro;
ALTER TABLE descuentos RENAME COLUMN frequency TO frecuencia;
ALTER TABLE descuentos RENAME COLUMN created_at TO creado_el;
ALTER TABLE descuentos RENAME COLUMN updated_at TO actualizado_el;

-- Renombrar columnas en errores_reportados
ALTER TABLE errores_reportados RENAME COLUMN discount_id TO id_descuento;
ALTER TABLE errores_reportados RENAME COLUMN is_discontinued TO esta_discontinuado;
ALTER TABLE errores_reportados RENAME COLUMN days_error TO error_dias;
ALTER TABLE errores_reportados RENAME COLUMN discount_error TO error_descuento;
ALTER TABLE errores_reportados RENAME COLUMN reimbursement_error TO error_reintegro;
ALTER TABLE errores_reportados RENAME COLUMN frequency_error TO error_frecuencia;
ALTER TABLE errores_reportados RENAME COLUMN suggested_days TO dias_sugeridos;
ALTER TABLE errores_reportados RENAME COLUMN suggested_discount TO descuento_sugerido;
ALTER TABLE errores_reportados RENAME COLUMN suggested_reimbursement TO reintegro_sugerido;
ALTER TABLE errores_reportados RENAME COLUMN suggested_frequency TO frecuencia_sugerida;
ALTER TABLE errores_reportados RENAME COLUMN evidence_url TO url_evidencia;
ALTER TABLE errores_reportados RENAME COLUMN comments TO comentarios;
ALTER TABLE errores_reportados RENAME COLUMN created_at TO creado_el;
ALTER TABLE errores_reportados RENAME COLUMN updated_at TO actualizado_el;

-- Renombrar políticas
DROP POLICY IF EXISTS "Allow public read access" ON descuentos;
DROP POLICY IF EXISTS "Allow authenticated users to manage discounts" ON descuentos;

CREATE POLICY "Permitir acceso público de lectura"
  ON descuentos
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Permitir a usuarios autenticados gestionar descuentos"
  ON descuentos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Renombrar función y trigger
DROP TRIGGER IF EXISTS update_discounts_updated_at ON descuentos;
DROP FUNCTION IF EXISTS update_updated_at();

CREATE OR REPLACE FUNCTION actualizar_actualizado_el()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_el = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actualizar_descuentos_actualizado_el
  BEFORE UPDATE ON descuentos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_actualizado_el(); 