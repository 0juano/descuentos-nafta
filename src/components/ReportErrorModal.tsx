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
  const frequencies = ['Weekly', 'Monthly'];

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

    // Validate URL format
    let url = formData.evidence_url;
    // If URL doesn't start with protocol, add https://
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    
    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid website address');
      return;
    }

    // Validate suggested days if days_error is checked
    if (formData.days_error && (!formData.suggested_days || formData.suggested_days.length === 0)) {
      setError('Please select at least one correct day');
      return;
    }

    // Validate discount percentage doesn't exceed 100%
    if (formData.discount_error && formData.suggested_discount !== undefined) {
      if (formData.suggested_discount > 100) {
        setError('Discount percentage cannot exceed 100%');
        return;
      }
      if (formData.suggested_discount < 0) {
        setError('Discount percentage cannot be negative');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      // Update the URL with protocol if it was added
      const dataToSubmit = {
        ...formData,
        evidence_url: url
      };
      await onSubmit(dataToSubmit);
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
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Report Discount Error</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Discontinued Checkbox */}
            <div>
              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.is_discontinued}
                  onChange={(e) => handleDiscontinuedChange(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>This discount has been discontinued</span>
              </label>
            </div>

            {/* Error Types Section */}
            <div className={formData.is_discontinued ? 'opacity-50' : ''}>
              <div className="mb-2 text-gray-700">What's incorrect?</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'days_error', label: 'Days' },
                  { key: 'discount_error', label: 'Discount Percentage' },
                  { key: 'reimbursement_error', label: 'Reimbursement Limit' },
                  { key: 'frequency_error', label: 'Frequency' }
                ].map(({ key, label }) => (
                  <label key={key} className={`flex items-center space-x-2 text-gray-700 ${formData.is_discontinued ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={formData[key as keyof typeof formData] as boolean}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        [key]: e.target.checked,
                        ...(key === 'days_error' && { suggested_days: e.target.checked ? [] : prev.suggested_days })
                      }))}
                      disabled={formData.is_discontinued}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className={formData.is_discontinued ? 'text-gray-400' : ''}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Conditional Input Fields */}
            <div className="space-y-4">
              {formData.days_error && (
                <div>
                  <label className="block mb-2 text-gray-700">Correct Days</label>
                  <div className="grid grid-cols-2 gap-2">
                    {days.map(day => (
                      <label key={day} className="flex items-center space-x-2 text-gray-700">
                        <input
                          type="checkbox"
                          checked={formData.suggested_days?.includes(day) || false}
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...(formData.suggested_days || []), day]
                              : (formData.suggested_days || []).filter(d => d !== day);
                            setFormData(prev => ({
                              ...prev,
                              suggested_days: newDays
                            }));
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.discount_error && (
                <div>
                  <label className="block mb-2 text-gray-700">
                    Correct Discount Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.suggested_discount || ''}
                      onChange={(e) => {
                        const value = e.target.valueAsNumber;
                        if (isNaN(value) || value <= 100) {
                          setFormData(prev => ({
                            ...prev,
                            suggested_discount: isNaN(value) ? undefined : value
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 pr-8"
                      placeholder="Enter correct percentage"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
              )}

              {formData.reimbursement_error && (
                <div>
                  <label className="block mb-2 text-gray-700">
                    Correct Reimbursement Limit
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      value={formData.suggested_reimbursement ? formData.suggested_reimbursement.toLocaleString('en-US') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setFormData(prev => ({
                          ...prev,
                          suggested_reimbursement: value ? parseInt(value) : undefined
                        }));
                      }}
                      className="w-full px-3 py-2 pl-7 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter correct limit"
                    />
                  </div>
                </div>
              )}

              {formData.frequency_error && (
                <div>
                  <label className="block mb-2 text-gray-700">
                    Correct Frequency
                  </label>
                  <select
                    value={formData.suggested_frequency || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      suggested_frequency: e.target.value
                    }))}
                    className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
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
            <div>
              <label className="block mb-2 text-gray-700">
                Evidence URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.evidence_url}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  evidence_url: e.target.value
                }))}
                className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="www.example.com"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the website where you found this information
              </p>
            </div>

            {/* Comments */}
            <div>
              <label className="block mb-2 text-gray-700">
                Additional Comments
              </label>
              <textarea
                value={formData.comments || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  comments: e.target.value
                }))}
                className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Any additional information..."
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
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
                className={`px-4 py-2 bg-indigo-600 text-white rounded-md ${
                  isSubmitting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-indigo-700'
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