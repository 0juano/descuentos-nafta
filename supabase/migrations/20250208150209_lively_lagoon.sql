/*
  # Crear Esquema de Descuentos de Combustible

  1. Nuevas Tablas
    - `descuentos`
      - `id` (text, primary key) - Identificador único para cada descuento
      - `marca_combustible` (text) - Marca que ofrece el descuento (YPF, SHELL, AXION, Multiple)
      - `dia` (text) - Día(s) cuando aplica el descuento
      - `metodo_pago` (text) - Método de pago requerido para el descuento
      - `descuento` (integer) - Porcentaje de descuento
      - `limite_gasto` (integer) - Monto máximo de gasto
      - `limite_reintegro` (integer) - Monto máximo de reintegro
      - `frecuencia` (text) - Frecuencia del descuento (Semanal, Mensual, etc.)
      - `creado_el` (timestamptz) - Marca de tiempo de creación del registro
      - `actualizado_el` (timestamptz) - Marca de tiempo de actualización del registro

  2. Seguridad
    - Habilitar RLS en la tabla `descuentos`
    - Agregar políticas para acceso público de lectura
    - Agregar políticas para que usuarios autenticados gestionen descuentos
*/

-- Crear tabla de descuentos
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

-- Habilitar RLS
ALTER TABLE descuentos ENABLE ROW LEVEL SECURITY;

-- Crear políticas
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

-- Crear función para actualizar marca de tiempo actualizado_el
CREATE OR REPLACE FUNCTION actualizar_actualizado_el()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_el = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar automáticamente actualizado_el
CREATE TRIGGER actualizar_descuentos_actualizado_el
  BEFORE UPDATE ON descuentos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_actualizado_el();