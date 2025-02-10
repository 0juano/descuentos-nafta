import { supabase } from './supabase';
import type { ReportarErrorData } from '../components/ReportErrorModal';

const CLAVE_ENFRIAMIENTO = 'ultimo_reporte_error_tiempo';
const DURACION_ENFRIAMIENTO = 30 * 1000; // 30 segundos en milisegundos

export const reportService = {
  async enviarReporte(data: ReportarErrorData): Promise<void> {
    // Check if there's already a pending report for this discount
    const { data: existingReport } = await supabase
      .from('reported_errors')
      .select('id')
      .eq('discount_id', data.discount_id)
      .single();

    if (existingReport) {
      throw new Error('Ya existe un reporte pendiente para este descuento');
    }

    // Insert the new report
    const { error } = await supabase
      .from('reported_errors')
      .insert({
        discount_id: data.discount_id,
        is_discontinued: data.esta_discontinuado,
        days_error: data.error_dias,
        discount_error: data.error_descuento,
        reimbursement_error: data.error_reintegro,
        frequency_error: data.error_frecuencia,
        suggested_days: data.dias_sugeridos,
        suggested_discount: data.descuento_sugerido,
        suggested_reimbursement: data.sin_limite_reintegro ? -1 : data.reintegro_sugerido,
        suggested_frequency: data.frecuencia_sugerida,
        evidence_url: data.url_evidencia,
        comments: data.comentarios
      });

    if (error) throw error;

    // Actualizar marca de tiempo de enfriamiento
    localStorage.setItem(CLAVE_ENFRIAMIENTO, Date.now().toString());
  },

  puedeEnviarReporte(): { puedeEnviar: boolean; tiempoRestante: number } {
    const ultimoTiempoReporte = localStorage.getItem(CLAVE_ENFRIAMIENTO);
    if (!ultimoTiempoReporte) {
      return { puedeEnviar: true, tiempoRestante: 0 };
    }

    const tiempoDesdeUltimoReporte = Date.now() - parseInt(ultimoTiempoReporte);
    if (tiempoDesdeUltimoReporte >= DURACION_ENFRIAMIENTO) {
      return { puedeEnviar: true, tiempoRestante: 0 };
    }

    return {
      puedeEnviar: false,
      tiempoRestante: Math.ceil((DURACION_ENFRIAMIENTO - tiempoDesdeUltimoReporte) / 1000)
    };
  }
}; 