import React, { useEffect } from 'react';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import X from 'lucide-react/dist/esm/icons/x';

interface ToastProps {
  mensaje: string;
  tipo?: 'exito' | 'error' | 'info';
  onClose: () => void;
  duracion?: number;
}

export const Toast: React.FC<ToastProps> = ({
  mensaje,
  tipo = 'exito',
  onClose,
  duracion = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duracion);

    return () => clearTimeout(timer);
  }, [duracion, onClose]);

  const getIcon = () => {
    switch (tipo) {
      case 'exito':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'info':
        return <AlertCircle className="h-5 w-5 text-blue-400" />;
    }
  };

  const getStyles = () => {
    const baseStyles = 'fixed bottom-4 right-4 flex items-center space-x-2 p-4 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out';
    switch (tipo) {
      case 'exito':
        return `${baseStyles} bg-green-50 text-green-800 border border-green-200`;
      case 'error':
        return `${baseStyles} bg-red-50 text-red-800 border border-red-200`;
      case 'info':
        return `${baseStyles} bg-blue-50 text-blue-800 border border-blue-200`;
    }
  };

  return (
    <div className={getStyles()}>
      <div className="flex items-center space-x-2">
        {getIcon()}
        <span className="text-sm font-medium">{mensaje}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}; 