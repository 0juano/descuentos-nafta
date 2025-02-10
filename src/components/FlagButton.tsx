import React, { useState } from 'react';
import Flag from 'lucide-react/dist/esm/icons/flag';

interface FlagButtonProps {
  onClick: () => void;
  className?: string;
}

export const FlagButton: React.FC<FlagButtonProps> = ({ onClick, className = '' }) => {
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left'>('top');
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    
    // Determine the best position for the tooltip
    if (spaceAbove >= 40) {
      setTooltipPosition('top');
    } else if (spaceBelow >= 40) {
      setTooltipPosition('bottom');
    } else {
      setTooltipPosition('left');
    }
    
    setShowTooltip(true);
  };

  const getTooltipClasses = () => {
    const baseClasses = "absolute px-2 py-1 text-xs text-white bg-red-600 rounded opacity-0 transition-opacity duration-200 whitespace-nowrap pointer-events-none group-hover:opacity-100";
    
    switch (tooltipPosition) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        className={`p-1 rounded-full hover:bg-red-50 transition-colors duration-200 group ${className}`}
        aria-label="Reportar un error"
      >
        <Flag className="w-4 h-4 text-red-500 group-hover:text-red-600" />
        <span className="sr-only">Reportar un error</span>
        
        {/* Tooltip */}
        {showTooltip && (
          <div className={getTooltipClasses()}>
            Reportar un error
          </div>
        )}
      </button>
    </div>
  );
}; 