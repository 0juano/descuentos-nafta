import React, { useState, useRef, useEffect } from 'react';
import X from 'lucide-react/dist/esm/icons/x';

interface ReportErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  discountId: string;
  onSubmit: (data: ReportErrorData) => Promise<void>;
}

export interface ReportErrorData {
  discount_id: string;
  days_error: boolean;
  discount_error: boolean;
  reimbursement_error: boolean;
  frequency_error: boolean;
  suggested_days: string[];
  suggested_discount?: number;
  suggested_reimbursement?: number;
  suggested_frequency?: string;
  evidence_url: string;
  comments?: string;
  is_discontinued: boolean;
}

export const ReportErrorModal: React.FC<ReportErrorModalProps> = ({
  isOpen,
  onClose,
  discountId,
  onSubmit,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<ReportErrorData>({
    discount_id: discountId,
    days_error: false,
    discount_error: false,
    reimbursement_error: false,
    frequency_error: false,
    suggested_days: [],
    evidence_url: '',
    is_discontinued: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const frequencies = ['Weekly', 'Monthly', 'Quarterly', 'Yearly', 'One-time'];

  // Add escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Add click outside handler
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDiscontinuedChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_discontinued: checked,
      // Reset error flags if discontinued is checked
      days_error: checked ? false : prev.days_error,
      discount_error: checked ? false : prev.discount_error,
      reimbursement_error: checked ? false : prev.reimbursement_error,
      frequency_error: checked ? false : prev.frequency_error,
      // Reset suggested values
      suggested_days: checked ? [] : prev.suggested_days,
      suggested_discount: checked ? undefined : prev.suggested_discount,
      suggested_reimbursement: checked ? undefined : prev.suggested_reimbursement,
      suggested_frequency: checked ? undefined : prev.suggested_frequency,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Only validate error types if not discontinued
    if (!formData.is_discontinued && 
        !formData.days_error && 
        !formData.discount_error && 
        !formData.reimbursement_error && 
        !formData.frequency_error) {
      setError('Please select at least one error type');
      return;
    }

    if (!formData.evidence_url) {
      setError('Evidence URL is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Report Discount Error</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Discontinued Checkbox - Move it to the top */}
            <div className="mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_discontinued}
                  onChange={(e) => handleDiscontinuedChange(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="font-medium">This discount has been discontinued</span>
              </label>
            </div>

            {/* Error Types Section */}
            <div className={`space-y-4 mb-6 ${formData.is_discontinued ? 'opacity-50' : ''}`}>
              <h3 className="font-medium">What's incorrect?</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center space-x-2 ${formData.is_discontinued ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={formData.days_error}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      days_error: e.target.checked
                    }))}
                    disabled={formData.is_discontinued}
                    className="rounded border-gray-300"
                  />
                  <span className={formData.is_discontinued ? 'text-gray-400' : ''}>Days</span>
                </label>
                <label className={`flex items-center space-x-2 ${formData.is_discontinued ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={formData.discount_error}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      discount_error: e.target.checked
                    }))}
                    disabled={formData.is_discontinued}
                    className="rounded border-gray-300"
                  />
                  <span className={formData.is_discontinued ? 'text-gray-400' : ''}>Discount Percentage</span>
                </label>
                <label className={`flex items-center space-x-2 ${formData.is_discontinued ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={formData.reimbursement_error}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      reimbursement_error: e.target.checked
                    }))}
                    disabled={formData.is_discontinued}
                    className="rounded border-gray-300"
                  />
                  <span className={formData.is_discontinued ? 'text-gray-400' : ''}>Reimbursement Limit</span>
                </label>
                <label className={`flex items-center space-x-2 ${formData.is_discontinued ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={formData.frequency_error}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      frequency_error: e.target.checked
                    }))}
                    disabled={formData.is_discontinued}
                    className="rounded border-gray-300"
                  />
                  <span className={formData.is_discontinued ? 'text-gray-400' : ''}>Frequency</span>
                </label>
              </div>
            </div>

            {/* Conditional Input Fields */}
            <div className="space-y-6 mb-6">
              {formData.days_error && (
                <div>
                  <label className="block font-medium mb-2">Correct Days</label>
                  <div className="grid grid-cols-2 gap-2">
                    {days.map(day => (
                      <label key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.suggested_days.includes(day)}
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...formData.suggested_days, day]
                              : formData.suggested_days.filter(d => d !== day);
                            setFormData(prev => ({
                              ...prev,
                              suggested_days: newDays
                            }));
                          }}
                          className="rounded border-gray-300"
                        />
                        <span>{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.discount_error && (
                <div>
                  <label className="block font-medium mb-2">
                    Correct Discount Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.suggested_discount || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      suggested_discount: e.target.valueAsNumber
                    }))}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter correct percentage"
                  />
                </div>
              )}

              {formData.reimbursement_error && (
                <div>
                  <label className="block font-medium mb-2">
                    Correct Reimbursement Limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.suggested_reimbursement || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      suggested_reimbursement: e.target.valueAsNumber
                    }))}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter correct limit"
                  />
                </div>
              )}

              {formData.frequency_error && (
                <div>
                  <label className="block font-medium mb-2">
                    Correct Frequency
                  </label>
                  <select
                    value={formData.suggested_frequency || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      suggested_frequency: e.target.value
                    }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select frequency</option>
                    {frequencies.map(freq => (
                      <option key={freq} value={freq}>
                        {freq}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Evidence URL */}
            <div className="mb-6">
              <label className="block font-medium mb-2">
                Evidence URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                required
                value={formData.evidence_url}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  evidence_url: e.target.value
                }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://"
              />
            </div>

            {/* Comments */}
            <div className="mb-6">
              <label className="block font-medium mb-2">
                Additional Comments
              </label>
              <textarea
                value={formData.comments || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  comments: e.target.value
                }))}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Any additional information..."
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
                  isSubmitting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 