-- Make fields optional in descuentos_recomendados table
ALTER TABLE descuentos_recomendados 
  ALTER COLUMN marca_combustible DROP NOT NULL,
  ALTER COLUMN dias DROP NOT NULL,
  ALTER COLUMN metodo_pago DROP NOT NULL,
  ALTER COLUMN porcentaje_descuento DROP NOT NULL,
  ALTER COLUMN limite_reintegro DROP NOT NULL,
  ALTER COLUMN frecuencia DROP NOT NULL;

-- Add check constraint to ensure at least one field is not null
ALTER TABLE descuentos_recomendados 
  ADD CONSTRAINT al_menos_un_campo_requerido 
  CHECK (
    marca_combustible IS NOT NULL OR 
    dias IS NOT NULL OR 
    metodo_pago IS NOT NULL OR 
    porcentaje_descuento IS NOT NULL OR 
    limite_reintegro IS NOT NULL OR 
    frecuencia IS NOT NULL
  ); 