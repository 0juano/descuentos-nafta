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
  sin_limite_reintegro?: boolean;
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

  const handleDiscountChange = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    // Convert to number for validation
    const numValue = parseInt(numericValue);
    // Only update if empty or valid percentage (0-100)
    if (numericValue === '' || (numValue >= 0 && numValue <= 100)) {
      setFormData(prev => ({
        ...prev,
        descuento_sugerido: numericValue ? Number(numericValue) : undefined
      }));
    }
  };

  const handleReimbursementChange = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    // Convert to number for validation
    const numValue = numericValue ? parseInt(numericValue) : undefined;
    // Only update if empty or less than or equal to 1,000,000
    if (!numValue || numValue <= 1000000) {
      setFormData(prev => ({
        ...prev,
        reintegro_sugerido: numValue,
        sin_limite_reintegro: false // Reset sin_limite when user types a value
      }));
    }
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
                  <label className="block mb-2 text-gray-700">Porcentaje de Descuento Correcto</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.descuento_sugerido || ''}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Ej: 15"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>
              )}

              {formData.error_reintegro && (
                <div>
                  <label className="block mb-2 text-gray-700">Límite de Reintegro Correcto</label>
                  <div className="space-y-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        value={formData.sin_limite_reintegro ? 'Sin límite' : (formData.reintegro_sugerido ? formData.reintegro_sugerido.toLocaleString('en-US') : '')}
                        onChange={(e) => handleReimbursementChange(e.target.value)}
                        className={`block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${formData.sin_limite_reintegro ? 'bg-gray-100 text-gray-500' : ''}`}
                        placeholder="Ej: 5,000 (máx: 1,000,000)"
                        disabled={formData.sin_limite_reintegro}
                      />
                    </div>
                    <label className="flex items-center space-x-2 text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.sin_limite_reintegro || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          sin_limite_reintegro: e.target.checked,
                          reintegro_sugerido: e.target.checked ? undefined : prev.reintegro_sugerido
                        }))}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-500">Sin límite de reintegro</span>
                    </label>
                  </div>
                </div>
              )}

              {formData.error_frecuencia && (
                <div>
                  <label className="block mb-2 text-gray-700">Frecuencia Correcta</label>
                  <select
                    value={formData.frecuencia_sugerida || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      frecuencia_sugerida: e.target.value || undefined
                    }))}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Seleccionar frecuencia</option>
                    {frecuencias.map(freq => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Evidence URL */}
              <div>
                <label className="block mb-2 text-gray-700">
                  URL de Evidencia
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.url_evidencia}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      url_evidencia: e.target.value
                    }))}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="https://ejemplo.com"
                  />
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block mb-2 text-gray-700">
                  Comentarios Adicionales
                </label>
                <textarea
                  value={formData.comentarios || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    comentarios: e.target.value || undefined
                  }))}
                  rows={3}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Agregue cualquier información adicional aquí..."
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 