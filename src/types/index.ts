export interface Descuento {
  id: string;
  marca_combustible: string;
  dia: string;
  metodo_pago: string;
  descuento: number;
  limite_reintegro: number;
  frecuencia: string;
  url_fuente?: string;
}

export interface DescuentoRecomendado {
  id: string;
  marca_combustible: string;
  dias: string[];
  metodo_pago: string;
  porcentaje_descuento: number;
  limite_reintegro: number;
  frecuencia: string;
  url_fuente?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  creado_el?: string;
  actualizado_el?: string;
}

export type MarcaCombustible = 'YPF' | 'SHELL' | 'AXION' | 'Multiple';