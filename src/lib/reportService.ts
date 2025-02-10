import { supabase } from './supabase';
import type { ReportErrorData } from '../components/ReportErrorModal';

const CLAVE_ENFRIAMIENTO = 'ultimo_reporte_error_tiempo';
const DURACION_ENFRIAMIENTO = 30 * 1000; // 30 segundos en milisegundos

export const reportService = {
  async enviarReporte(data: ReportErrorData): Promise<void> {
    // Verificar enfriamiento
    const ultimoTiempoReporte = localStorage.getItem(CLAVE_ENFRIAMIENTO);
    if (ultimoTiempoReporte) {
      const tiempoDesdeUltimoReporte = Date.now() - parseInt(ultimoTiempoReporte);
      if (tiempoDesdeUltimoReporte < DURACION_ENFRIAMIENTO) {
        throw new Error(`Por favor espere ${Math.ceil((DURACION_ENFRIAMIENTO - tiempoDesdeUltimoReporte) / 1000 / 60)} minutos antes de enviar otro reporte.`);
      }
    }

    try {
      const { error } = await supabase
        .from('errores_reportados')
        .insert([{
          id_descuento: data.discount_id,
          esta_discontinuado: data.is_discontinued,
          error_dias: data.days_error,
          error_descuento: data.discount_error,
          error_reintegro: data.reimbursement_error,
          error_frecuencia: data.frequency_error,
          dias_sugeridos: data.suggested_days,
          descuento_sugerido: data.suggested_discount,
          reintegro_sugerido: data.suggested_reimbursement,
          frecuencia_sugerida: data.suggested_frequency,
          url_evidencia: data.evidence_url,
          comentarios: data.comments
        }]);

      if (error) {
        if (error.message?.includes('ya existe un reporte pendiente')) {
          throw new Error('Ya existe un reporte pendiente de revisión para este descuento.');
        }
        throw error;
      }

      // Actualizar marca de tiempo de enfriamiento
      localStorage.setItem(CLAVE_ENFRIAMIENTO, Date.now().toString());
    } catch (error) {
      console.error('Error al enviar reporte:', error);
      throw error;
    }
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