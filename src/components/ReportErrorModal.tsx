import React, { useState, useRef, useEffect } from 'react';
import X from 'lucide-react/dist/esm/icons/x';

interface ReportarErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  discountId: string;
  onSubmit: (data: ReportarErrorData) => Promise<void>;
}

export interface ReportarErrorData {
  discount_id: string;
  error_dias: boolean;
  error_descuento: boolean;
  error_reintegro: boolean;
  error_frecuencia: boolean;
  dias_sugeridos: string[];
  descuento_sugerido?: number;
  reintegro_sugerido?: number;
  frecuencia_sugerida?: string;
  url_evidencia: string;
  comentarios?: string;
  esta_discontinuado: boolean;
}

export const ReportErrorModal: React.FC<ReportarErrorModalProps> = ({
  isOpen,
  onClose,
  discountId,
  onSubmit,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<ReportarErrorData>({
    discount_id: discountId,
    error_dias: false,
    error_descuento: false,
    error_reintegro: false,
    error_frecuencia: false,
    dias_sugeridos: [],
    url_evidencia: '',
    esta_discontinuado: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const frecuencias = ['Semanal', 'Mensual'];

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
      esta_discontinuado: checked,
      // Reset error flags if discontinued is checked
      error_dias: checked ? false : prev.error_dias,
      error_descuento: checked ? false : prev.error_descuento,
      error_reintegro: checked ? false : prev.error_reintegro,
      error_frecuencia: checked ? false : prev.error_frecuencia,
      // Reset suggested values
      dias_sugeridos: checked ? [] : prev.dias_sugeridos,
      descuento_sugerido: checked ? undefined : prev.descuento_sugerido,
      reintegro_sugerido: checked ? undefined : prev.reintegro_sugerido,
      frecuencia_sugerida: checked ? undefined : prev.frecuencia_sugerida,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Only validate error types if not discontinued
    if (!formData.esta_discontinuado && 
        !formData.error_dias && 
        !formData.error_descuento && 
        !formData.error_reintegro && 
        !formData.error_frecuencia) {
      setError('Por favor seleccione al menos un tipo de error');
      return;
    }

    if (!formData.url_evidencia) {
      setError('La URL de evidencia es requerida');
      return;
    }

    // Validate URL format
    let url = formData.url_evidencia;
    // If URL doesn't start with protocol, add https://
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    
    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Por favor ingrese una dirección web válida');
      return;
    }

    // Validate suggested days if days_error is checked
    if (formData.error_dias && (!formData.dias_sugeridos || formData.dias_sugeridos.length === 0)) {
      setError('Por favor seleccione al menos un día correcto');
      return;
    }

    // Validate discount percentage doesn't exceed 100%
    if (formData.error_descuento && formData.descuento_sugerido !== undefined) {
      if (formData.descuento_sugerido > 100) {
        setError('El porcentaje de descuento no puede exceder el 100%');
        return;
      }
      if (formData.descuento_sugerido < 0) {
        setError('El porcentaje de descuento no puede ser negativo');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      // Update the URL with protocol if it was added
      const dataToSubmit = {
        ...formData,
        url_evidencia: url
      };
      await onSubmit(dataToSubmit);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el reporte');
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
            <h2 className="text-xl font-bold text-gray-900">Reportar Error en Descuento</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Cerrar"
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
                  checked={formData.esta_discontinuado}
                  onChange={(e) => handleDiscontinuedChange(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Este descuento ha sido discontinuado</span>
              </label>
            </div>

            {/* Error Types Section */}
            <div className={formData.esta_discontinuado ? 'opacity-50' : ''}>
              <div className="mb-2 text-gray-700">¿Qué es incorrecto?</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'error_dias', label: 'Días' },
                  { key: 'error_descuento', label: 'Porcentaje de Descuento' },
                  { key: 'error_reintegro', label: 'Límite de Reintegro' },
                  { key: 'error_frecuencia', label: 'Frecuencia' }
                ].map(({ key, label }) => (
                  <label key={key} className={`flex items-center space-x-2 text-gray-700 ${formData.esta_discontinuado ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={formData[key as keyof typeof formData] as boolean}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        [key]: e.target.checked,
                        ...(key === 'error_dias' && { dias_sugeridos: e.target.checked ? [] : prev.dias_sugeridos })
                      }))}
                      disabled={formData.esta_discontinuado}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className={formData.esta_discontinuado ? 'text-gray-400' : ''}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Conditional Input Fields */}
            <div className="space-y-4">
              {formData.error_dias && (
                <div>
                  <label className="block mb-2 text-gray-700">Días Correctos</label>
                  <div className="grid grid-cols-2 gap-2">
                    {dias.map(dia => (
                      <label key={dia} className="flex items-center space-x-2 text-gray-700">
                        <input
                          type="checkbox"
                          checked={formData.dias_sugeridos?.includes(dia) || false}
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...(formData.dias_sugeridos || []), dia]
                              : (formData.dias_sugeridos || []).filter(d => d !== dia);
                            setFormData(prev => ({
                              ...prev,
                              dias_sugeridos: newDays
                            }));
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{dia}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.error_descuento && (
                <div>
                  <label className="block mb-2 text-gray-700">
                    Correct Discount Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.descuento_sugerido || ''}
                      onChange={(e) => {
                        const value = e.target.valueAsNumber;
                        if (isNaN(value) || value <= 100) {
                          setFormData(prev => ({
                            ...prev,
                            descuento_sugerido: isNaN(value) ? undefined : value
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

              {formData.error_reintegro && (
                <div>
                  <label className="block mb-2 text-gray-700">
                    Correct Reimbursement Limit
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      value={formData.reintegro_sugerido ? formData.reintegro_sugerido.toLocaleString('en-US') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setFormData(prev => ({
                          ...prev,
                          reintegro_sugerido: value ? parseInt(value) : undefined
                        }));
                      }}
                      className="w-full px-3 py-2 pl-7 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter correct limit"
                    />
                  </div>
                </div>
              )}

              {formData.error_frecuencia && (
                <div>
                  <label className="block mb-2 text-gray-700">
                    Correct Frequency
                  </label>
                  <select
                    value={formData.frecuencia_sugerida || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      frecuencia_sugerida: e.target.value
                    }))}
                    className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">Select frequency</option>
                    {frecuencias.map(freq => (
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
                value={formData.url_evidencia}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  url_evidencia: e.target.value
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
                value={formData.comentarios || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  comentarios: e.target.value
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