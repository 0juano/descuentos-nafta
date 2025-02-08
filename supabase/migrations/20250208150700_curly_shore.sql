/*
  # Seed discounts data

  1. Data Seeding
    - Insert initial discount records for all fuel brands
    - Includes discounts for YPF, SHELL, AXION, and Multiple brands
    - Each record includes brand, day, card method, discount percentage, spending limit, and reimbursement limit
*/

-- General Discounts
INSERT INTO discounts (id, fuel_brand, day, card_method, discount, spending_limit, reimbursement_limit, frequency)
VALUES
  ('general-1', 'Multiple', 'Monday', 'Galicia Mastercard + MODO', 10, 100000, 10000, 'General Discount'),
  ('general-2', 'Multiple', 'Monday', 'Galicia Mastercard Eminent + MODO', 15, 100000, 15000, 'General Discount'),
  ('general-3', 'Multiple', 'Sunday', 'Crédito Ciudad/Buepp + MODO', 10, 100000, 10000, 'General Discount');

-- YPF Discounts
INSERT INTO discounts (id, fuel_brand, day, card_method, discount, spending_limit, reimbursement_limit, frequency)
VALUES
  ('ypf-1', 'YPF', 'Monday & Tuesday', 'Tarjeta Personal Pay', 20, 25000, 5000, 'Weekly (Shellbox + 1,000 extra)'),
  ('ypf-2', 'YPF', 'Monday', 'Galicia Crédito Master Premium + MODO', 15, 100000, 15000, 'Monthly'),
  ('ypf-3', 'YPF', 'Monday', 'Galicia Crédito Master + MODO', 10, 100000, 10000, 'Monthly'),
  ('ypf-4', 'YPF', 'Every day', 'MODO + BNA Crédito', 15, 100000, 15000, 'Monthly'),
  ('ypf-5', 'YPF', 'Every day', 'NaranjaX Crédito desde APP YPF', 30, 33333, 10000, 'Monthly'),
  ('ypf-6', 'YPF', 'Wednesday', 'MODO + Macro Visa Signature Selecta', 30, 33333, 10000, 'Monthly'),
  ('ypf-7', 'YPF', 'Wednesday', 'MODO + Macro Crédito Visa Platinum', 30, 33333, 10000, 'Monthly'),
  ('ypf-8', 'YPF', 'Sunday', 'MODO + Ciudad/Buepp', 10, 100000, 10000, 'Monthly'),
  ('ypf-9', 'YPF', 'Every day', 'MODO + Hipotecario Crédito', 10, 100000, 10000, 'Monthly'),
  ('ypf-10', 'YPF', 'Saturday & Sunday', 'NaranjaX Débito desde APP YPF', 30, 30000, 10000, 'Monthly'),
  ('ypf-11', 'YPF', 'Every day', 'Santander Visa Black/Platinum', 20, 30000, 6000, 'Monthly'),
  ('ypf-12', 'YPF', 'Thursday', 'Exclusivo desde APP YPF', 30, 67000, 20000, 'Monthly');

-- SHELL Discounts
INSERT INTO discounts (id, fuel_brand, day, card_method, discount, spending_limit, reimbursement_limit, frequency)
VALUES
  ('shell-1', 'SHELL', 'Monday & Tuesday', 'Tarjeta Personal Pay', 20, 25000, 5000, 'Weekly (Shellbox + 1,000 extra)'),
  ('shell-2', 'SHELL', 'Every day', 'Tarjeta N1U', 30, 20000, 6000, 'Monthly'),
  ('shell-3', 'SHELL', 'Every day', 'MODO + BNA Crédito', 25, 80000, 20000, 'Monthly');

-- AXION Discounts
INSERT INTO discounts (id, fuel_brand, day, card_method, discount, spending_limit, reimbursement_limit, frequency)
VALUES
  ('axion-1', 'AXION', 'Every day', 'BNA+', 10, 150000, 15000, 'Monthly'),
  ('axion-2', 'AXION', 'Monday & Tuesday', 'Tarjeta Personal Pay', 20, 25000, 5000, 'Weekly'),
  ('axion-3', 'AXION', 'Friday', 'Reba (Crédito American Express)', 20, 25000, 5000, 'Monthly'),
  ('axion-4', 'AXION', 'Every day', 'MODO + Patagonia (débito/crédito)', 10, 150000, 3000, 'Monthly'),
  ('axion-5', 'AXION', 'Friday to Sunday', 'MODO + BBVA Crédito', 30, 15000, 4500, 'Monthly'),
  ('axion-6', 'AXION', 'Monday & Friday', 'Galicia MAS Mastercard Premier', 10, 60000, 6000, 'Monthly'),
  ('axion-7', 'AXION', 'Saturday', 'MODO + Supervielle (Clientes Identité/cue)', 10, 100000, 10000, 'Monthly'),
  ('axion-8', 'AXION', 'Sunday', 'MODO + Comafi', 10, 40000, 4000, 'Monthly'),
  ('axion-9', 'AXION', 'Sunday', 'MODO + Buepp/Ciudad', 15, 67000, 10000, 'Monthly'),
  ('axion-10', 'AXION', 'Wednesday', 'Banco del Sol Débito', 20, 25000, 5000, 'Monthly');