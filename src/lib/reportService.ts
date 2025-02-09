import { supabase } from './supabase';
import type { ReportErrorData } from '../components/ReportErrorModal';

const COOLDOWN_KEY = 'last_error_report_time';
const COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const reportService = {
  async submitReport(data: ReportErrorData): Promise<void> {
    // Check cooldown
    const lastReportTime = localStorage.getItem(COOLDOWN_KEY);
    if (lastReportTime) {
      const timeSinceLastReport = Date.now() - parseInt(lastReportTime);
      if (timeSinceLastReport < COOLDOWN_DURATION) {
        throw new Error(`Please wait ${Math.ceil((COOLDOWN_DURATION - timeSinceLastReport) / 1000 / 60)} minutes before submitting another report.`);
      }
    }

    try {
      const { error } = await supabase
        .from('reported_errors')
        .insert([{
          discount_id: data.discount_id,
          is_discontinued: data.is_discontinued,
          days_error: data.days_error,
          discount_error: data.discount_error,
          reimbursement_error: data.reimbursement_error,
          frequency_error: data.frequency_error,
          suggested_days: data.suggested_days,
          suggested_discount: data.suggested_discount,
          suggested_reimbursement: data.suggested_reimbursement,
          suggested_frequency: data.suggested_frequency,
          evidence_url: data.evidence_url,
          comments: data.comments
        }]);

      if (error) {
        if (error.message.includes('pending report already exists')) {
          throw new Error('A report for this discount is already pending review.');
        }
        throw error;
      }

      // Update cooldown timestamp
      localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  },

  canSubmitReport(): { canSubmit: boolean; timeLeft: number } {
    const lastReportTime = localStorage.getItem(COOLDOWN_KEY);
    if (!lastReportTime) {
      return { canSubmit: true, timeLeft: 0 };
    }

    const timeSinceLastReport = Date.now() - parseInt(lastReportTime);
    if (timeSinceLastReport >= COOLDOWN_DURATION) {
      return { canSubmit: true, timeLeft: 0 };
    }

    return {
      canSubmit: false,
      timeLeft: Math.ceil((COOLDOWN_DURATION - timeSinceLastReport) / 1000)
    };
  }
}; 