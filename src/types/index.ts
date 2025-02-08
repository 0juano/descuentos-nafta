export interface Discount {
  id: string;
  fuel_brand: string;
  day: string;
  card_method: string;
  discount: number;
  spending_limit: number;
  reimbursement_limit: number;
  frequency: string;
  created_at?: string;
  updated_at?: string;
}

export type FuelBrand = 'YPF' | 'SHELL' | 'AXION' | 'Multiple';