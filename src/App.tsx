import React, { useEffect, useState, useRef } from 'react';
import Filter from 'lucide-react/dist/esm/icons/filter';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Clock from 'lucide-react/dist/esm/icons/clock';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowUpDown from 'lucide-react/dist/esm/icons/arrow-up-down';
import Search from 'lucide-react/dist/esm/icons/search';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Link from 'lucide-react/dist/esm/icons/link';
import ypfLogo from './icons/ypf.svg';
import shellLogo from './icons/shell.png';
import axionLogo from './icons/axion.webp';
import { supabase } from './lib/supabase';
import { reportService } from './lib/reportService';
import { FlagButton } from './components/FlagButton';
import { ReportErrorModal, type ReportarErrorData } from './components/ReportErrorModal';
import type { Descuento } from './types';
import { Toast } from './components/Toast';
import { ThemeToggle } from './components/ui/theme-toggle';

type CampoOrdenamiento = 'descuento' | 'limite_reintegro' | 'marca_combustible' | 'dia' | null;
type DireccionOrdenamiento = 'asc' | 'desc';

interface DatosFormularioRecomendacion {
  marca_combustible: string[];
  dia: string[];
  metodo_pago: string;
  descuento: string;
  limite_reintegro: string;
  sin_limite_reintegro: boolean;
  frecuencia: string;
  url_fuente: string;
}

interface RecommendedDiscountInsert {
  fuel_brand?: string;
  days?: string[];
  payment_method?: string;
  discount_percentage?: number;
  reimbursement_limit?: number | null;
  frequency?: string;
  source_url?: string;
  status: 'pending' | 'approved' | 'rejected';
}

function App() {
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [dayDropdownOpen, setDayDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState<CampoOrdenamiento>(null);
  const [sortDirection, setSortDirection] = useState<DireccionOrdenamiento>('desc');
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isRecommendButtonDisabled, setIsRecommendButtonDisabled] = useState(false);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const [recommendFormData, setRecommendFormData] = useState<DatosFormularioRecomendacion>({
    marca_combustible: [],
    dia: [],
    metodo_pago: '',
    descuento: '',
    limite_reintegro: '',
    sin_limite_reintegro: false,
    frecuencia: '',
    url_fuente: ''
  });
  const [selectedDiscountForReport, setSelectedDiscountForReport] = useState<Descuento | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' | 'info' } | null>(null);

  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const dayDropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const recommendBrandDropdownRef = useRef<HTMLDivElement>(null);

  const brands = ['YPF', 'SHELL', 'AXION', 'Multiple'];
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo', 'Todos los días'];

  const [recommendBrandDropdownOpen, setRecommendBrandDropdownOpen] = useState(false);

  // Add state for recommend day dropdown
  const [recommendDayDropdownOpen, setRecommendDayDropdownOpen] = useState(false);
  const recommendDayDropdownRef = useRef<HTMLDivElement>(null);

  // Add abbreviation mapping
  const dayAbbreviations: Record<string, string> = {
    'Lunes': 'Lun',
    'Martes': 'Mar',
    'Miércoles': 'Mié',
    'Jueves': 'Jue',
    'Viernes': 'Vie',
    'Sábado': 'Sáb',
    'Domingo': 'Dom',
    'Todos los días': 'Todos'
  };

  // Add helper function to abbreviate days
  const getAbbreviatedDay = (day: string): string => {
    return dayAbbreviations[day] || day;
  };

  const getDiscountBadgeStyle = (percentage: number): string => {
    if (percentage > 20) {
      return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 ring-1 ring-purple-600/20 dark:ring-purple-300/20';
    } else if (percentage > 10) {
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 ring-1 ring-green-600/20 dark:ring-green-300/20';
    }
    return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 ring-1 ring-blue-600/20 dark:ring-blue-300/20';
  };

  const getReimburseLimitStyle = (limit: number): string => {
    if (limit > 10000) {
      return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 ring-1 ring-purple-600/20 dark:ring-purple-300/20';
    } else if (limit > 5000) {
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 ring-1 ring-green-600/20 dark:ring-green-300/20';
    }
    return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 ring-1 ring-blue-600/20 dark:ring-blue-300/20';
  };

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const mobileFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setBrandDropdownOpen(false);
      }
      if (dayDropdownRef.current && !dayDropdownRef.current.contains(event.target as Node)) {
        setDayDropdownOpen(false);
      }
      if (mobileFilterRef.current && !mobileFilterRef.current.contains(event.target as Node)) {
        setMobileFilterOpen(false);
      }
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsRecommendModalOpen(false);
      }
      if (recommendBrandDropdownRef.current && !recommendBrandDropdownRef.current.contains(event.target as Node)) {
        setRecommendBrandDropdownOpen(false);
      }
      if (recommendDayDropdownRef.current && !recommendDayDropdownRef.current.contains(event.target as Node)) {
        setRecommendDayDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDiscountChange = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    // Convert to number for validation
    const numValue = parseInt(numericValue);
    // Only update if empty or valid percentage (0-100)
    if (numericValue === '' || (numValue >= 0 && numValue <= 100)) {
      setRecommendFormData(prev => ({ ...prev, descuento: numericValue }));
    }
  };

  const handleReimbursementLimitChange = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^\d]/g, '');
    // Limit to 1,000,000
    const limitedValue = numericValue ? Math.min(parseInt(numericValue), 1000000).toString() : '';
    // Format with thousand separators if there's a value
    const formattedValue = limitedValue ? Number(limitedValue).toLocaleString('es-AR').replace(/\./g, ',') : '';
    setRecommendFormData(prev => ({ ...prev, limite_reintegro: formattedValue }));
  };

  const toggleRecommendDay = (day: string) => {
    setRecommendFormData(prev => {
      const newDays = prev.dia.includes(day)
        ? prev.dia.filter((d: string) => d !== day)
        : [...prev.dia, day];
      
      // If "Todos los días" is selected, clear other selections
      if (day === 'Todos los días') {
        return { ...prev, dia: newDays.includes('Todos los días') ? ['Todos los días'] : [] };
      }
      
      // If another day is selected and "Todos los días" was previously selected, remove it
      if (prev.dia.includes('Todos los días')) {
        return { ...prev, dia: [day] };
      }
      
      return { ...prev, dia: newDays };
    });
  };

  const handleSearch = (value: string) => {
    try {
      const sanitizedValue = value
        .replace(/[^\w\s]/g, '')
        .trim()
        .slice(0, 100);
      setSearchQuery(sanitizedValue);
    } catch (error) {
      console.error('Error en la búsqueda:', error);
      setError('Entrada de búsqueda inválida. Por favor, intente de nuevo.');
    }
  };

  useEffect(() => {
    fetchDescuentos();
  }, [selectedBrands, selectedDays, sortField, sortDirection, searchQuery]);

  async function fetchDescuentos() {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('descuentos')
        .select('*');

      // Apply brand filter
      if (selectedBrands.length > 0) {
        query = query.in('marca_combustible', selectedBrands);
      }

      // Apply day filter
      if (selectedDays.length > 0) {
        const dayConditions = selectedDays.map(day => {
          if (day === 'Todos los días') {
            return `dia.ilike.%${day}%`;
          }
          return `dia.ilike.%${day}%`;
        });
        query = query.or(dayConditions.join(','));
      }

      // Apply search query if present and valid
      if (searchQuery.trim()) {
        const searchTerm = searchQuery.toLowerCase().trim();
        if (searchTerm.length <= 100 && /^[\w\s]*$/.test(searchTerm)) {
          const conditions = [
            `metodo_pago.ilike.%${searchTerm}%`,
            `frecuencia.ilike.%${searchTerm}%`
          ];
          
          if (selectedBrands.length === 0) {
            conditions.push(`marca_combustible.ilike.%${searchTerm}%`);
          }
          
          if (selectedDays.length === 0) {
            conditions.push(`dia.ilike.%${searchTerm}%`);
          }
          
          query = query.or(conditions.join(','));
        } else {
          throw new Error('Búsqueda inválida. Por favor use solo letras, números y espacios.');
        }
      }

      // Apply sorting
      if (sortField) {
        query = query.order(sortField, { ascending: sortDirection === 'asc' });
      }

      const { data, error: supabaseError } = await query;
      
      if (supabaseError) throw supabaseError;

      setDescuentos(data || []);
    } catch (error) {
      console.error('Error al cargar los descuentos:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar los descuentos');
      setDescuentos([]);
    } finally {
      setLoading(false);
    }
  }

  const handleSort = (field: CampoOrdenamiento) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: CampoOrdenamiento) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'asc' ? 'text-blue-600 rotate-180' : 'text-blue-600'}`} />;
  };

  const getBrandIcon = (brand: string) => {
    switch (brand.toUpperCase()) {
      case 'YPF':
        return <img src={ypfLogo} alt="YPF" className="inline-block mr-2 h-5 w-5 object-contain" />;
      case 'SHELL':
        return <img src={shellLogo} alt="Shell" className="inline-block mr-2 h-5 w-5 object-contain" />;
      case 'AXION':
        return <img src={axionLogo} alt="Axion" className="inline-block mr-2 h-5 w-5 object-contain" />;
      default:
        return null;
    }
  };

  const getBrandColor = (brand: string): string => {
    switch (brand.toUpperCase()) {
      case 'YPF':
        return 'bg-blue-100 text-blue-800 ring-1 ring-blue-600/20';
      case 'SHELL':
        return 'bg-red-100 text-red-800 ring-1 ring-red-600/20';
      case 'AXION':
        return 'bg-purple-100 text-purple-800 ring-1 ring-purple-600/20';
      default:
        return 'bg-gray-100 text-gray-800 ring-1 ring-gray-600/20';
    }
  };

  const handleBrandSelect = (brand: string) => {
    setSelectedBrands(prev => {
      const newBrands = prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand];
      return newBrands;
    });
  };

  const handleDaySelect = (day: string) => {
    setSelectedDays(prev => {
      let newDays;
      if (day === 'Todos los días') {
        newDays = prev.includes(day) ? [] : ['Todos los días'];
      } else {
        newDays = prev.includes(day)
          ? prev.filter(d => d !== day)
          : prev.includes('Todos los días')
          ? [day]
          : [...prev, day];
      }
      return newDays;
    });
  };

  // Add effect to handle rate limiting persistence and countdown
  useEffect(() => {
    // Check localStorage for existing cooldown
    const lastRecommendTime = localStorage.getItem('lastRecommendTime');
    if (lastRecommendTime) {
      const timeElapsed = Date.now() - parseInt(lastRecommendTime);
      const cooldownPeriod = 3000; // 3 seconds in milliseconds
      
      if (timeElapsed < cooldownPeriod) {
        setIsRecommendButtonDisabled(true);
        setCooldownTimeLeft(Math.ceil((cooldownPeriod - timeElapsed) / 1000));
        
        // Set up countdown timer
        const timer = setInterval(() => {
          setCooldownTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              setIsRecommendButtonDisabled(false);
              localStorage.removeItem('lastRecommendTime');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } else {
        localStorage.removeItem('lastRecommendTime');
      }
    }
  }, []);

  const startCooldown = () => {
    setIsRecommendButtonDisabled(true);
    setCooldownTimeLeft(3);
    localStorage.setItem('lastRecommendTime', Date.now().toString());

    const timer = setInterval(() => {
      setCooldownTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRecommendButtonDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRecommendClick = () => {
    if (!isRecommendButtonDisabled) {
      setIsRecommendModalOpen(true);
    }
  };

  const handleRecommendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (recommendFormData.marca_combustible.length === 0) {
      setToast({ mensaje: 'La marca de combustible es obligatoria', tipo: 'error' });
      return;
    }
    if (recommendFormData.dia.length === 0) {
      setToast({ mensaje: 'Debe seleccionar al menos un día', tipo: 'error' });
      return;
    }
    if (!recommendFormData.metodo_pago.trim()) {
      setToast({ mensaje: 'El método de pago es obligatorio', tipo: 'error' });
      return;
    }
    if (!recommendFormData.descuento.trim()) {
      setToast({ mensaje: 'El descuento es obligatorio', tipo: 'error' });
      return;
    }
    if (!recommendFormData.limite_reintegro.trim() && !recommendFormData.sin_limite_reintegro) {
      setToast({ mensaje: 'El límite de reintegro es obligatorio', tipo: 'error' });
      return;
    }
    if (!recommendFormData.frecuencia.trim()) {
      setToast({ mensaje: 'La frecuencia es obligatoria', tipo: 'error' });
      return;
    }

    setIsRecommendButtonDisabled(true);

    try {
      // Prepare the data with required fields
      const insertData: RecommendedDiscountInsert = {
        status: 'pending',
        fuel_brand: recommendFormData.marca_combustible[0],
        days: recommendFormData.dia,
        payment_method: recommendFormData.metodo_pago.trim(),
        discount_percentage: parseInt(recommendFormData.descuento),
        reimbursement_limit: recommendFormData.sin_limite_reintegro ? null : parseInt(recommendFormData.limite_reintegro.replace(/,/g, '')),
        frequency: recommendFormData.frecuencia.trim()
      };
      
      // Add optional URL if provided
      if (recommendFormData.url_fuente.trim()) {
        insertData.source_url = recommendFormData.url_fuente.trim();
      }

      const { error: supabaseError } = await supabase
        .from('recommended_discounts')
        .insert(insertData)
        .select();

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        setToast({ mensaje: `Error al enviar la recomendación: ${supabaseError.message}`, tipo: 'error' });
        throw supabaseError;
      }

      setToast({ mensaje: '¡Recomendación enviada exitosamente!', tipo: 'exito' });
      setIsRecommendModalOpen(false);
      setRecommendFormData({
        marca_combustible: [],
        dia: [],
        metodo_pago: '',
        descuento: '',
        limite_reintegro: '',
        sin_limite_reintegro: false,
        frecuencia: '',
        url_fuente: ''
      });
      startCooldown();
    } catch (error) {
      console.error('Error submitting recommendation:', error);
      if (error instanceof Error) {
        setToast({ mensaje: `Error: ${error.message}`, tipo: 'error' });
      } else {
        setToast({ mensaje: 'Ocurrió un error inesperado al enviar la recomendación', tipo: 'error' });
      }
    } finally {
      setIsRecommendButtonDisabled(false);
    }
  };

  const toggleRecommendBrand = (brand: string) => {
    setRecommendFormData(prev => {
      const newBrands = prev.marca_combustible.includes(brand)
        ? prev.marca_combustible.filter(b => b !== brand)
        : [...prev.marca_combustible, brand];
      return { ...prev, marca_combustible: newBrands };
    });
  };

  // Add ESC key handler
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isRecommendModalOpen) {
        setIsRecommendModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isRecommendModalOpen]);

  // Add scroll handler
  useEffect(() => {
    const controlSearchBar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        
        // Only hide on mobile screens
        if (window.innerWidth <= 640) {
          if (currentScrollY > 50) {
            setShowSearch(false);
          } else {
            setShowSearch(true);
          }
        } else {
          setShowSearch(true); // Always show on desktop
        }
        
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', controlSearchBar);
    window.addEventListener('resize', controlSearchBar);

    return () => {
      window.removeEventListener('scroll', controlSearchBar);
      window.removeEventListener('resize', controlSearchBar);
    };
  }, [lastScrollY]);

  // Add handler for report submission
  const handleReportSubmit = async (data: ReportarErrorData) => {
    try {
      await reportService.enviarReporte(data);
      setToast({ mensaje: 'Reporte enviado exitosamente', tipo: 'exito' });
    } catch (err) {
      console.error('Error al enviar el reporte:', err);
      setToast({ mensaje: 'Error al enviar el reporte', tipo: 'error' });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Descuentos de Combustible</h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                onClick={handleRecommendClick}
                disabled={isRecommendButtonDisabled}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isRecommendButtonDisabled 
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isRecommendButtonDisabled 
                  ? cooldownTimeLeft > 0 
                    ? `Espere ${cooldownTimeLeft}s...` 
                    : 'Procesando...'
                  : 'Recomendar Descuento'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          {/* Mobile layout */}
          <div className="sm:hidden mb-4">
            <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2 transition-opacity duration-200 ${showSearch ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Buscar descuentos, tarjetas, marcas..."
                    className="block w-full pl-8 pr-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="relative" ref={mobileFilterRef}>
                  <button
                    onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                    className="inline-flex items-center px-2 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <ChevronDown className="h-4 w-4 ml-1 text-gray-400 dark:text-gray-500" />
                  </button>

                  {mobileFilterOpen && (
                    <div className="absolute right-0 mt-1 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                      <div className="p-4">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marcas</label>
                          <div className="space-y-2">
                            {brands.map(brand => (
                              <label key={brand} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedBrands.includes(brand)}
                                  onChange={() => handleBrandSelect(brand)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                                  {getBrandIcon(brand)}
                                  {brand}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Días</label>
                          <div className="space-y-2">
                            {days.map(day => (
                              <label key={day} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedDays.includes(day)}
                                  onChange={() => handleDaySelect(day)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{day}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden sm:block">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Buscar descuentos, tarjetas, marcas..."
                    className="block w-full pl-8 pr-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros:</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="relative" ref={brandDropdownRef}>
                    <button
                      onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
                      className="flex items-center justify-between w-48 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <span className="truncate text-gray-700 dark:text-gray-300">
                        {selectedBrands.length === 0 
                          ? 'Seleccionar Marcas'
                          : selectedBrands.join(', ')}
                      </span>
                      <ChevronDown className="h-4 w-4 ml-2 text-gray-400 dark:text-gray-500" />
                    </button>
                    {brandDropdownOpen && (
                      <div className="absolute mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                        <div className="p-2">
                          {brands.map(brand => (
                            <label key={brand} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedBrands.includes(brand)}
                                onChange={() => handleBrandSelect(brand)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                                {getBrandIcon(brand)}
                                {brand}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={dayDropdownRef}>
                    <button
                      onClick={() => setDayDropdownOpen(!dayDropdownOpen)}
                      className="flex items-center justify-between w-48 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <span className="truncate text-gray-700 dark:text-gray-300">
                        {selectedDays.length === 0 
                          ? 'Seleccionar Días'
                          : selectedDays.map(day => getAbbreviatedDay(day)).join(', ')}
                      </span>
                      <ChevronDown className="h-4 w-4 ml-2 text-gray-400 dark:text-gray-500" />
                    </button>
                    {dayDropdownOpen && (
                      <div className="absolute mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                        <div className="p-2">
                          {days.map(day => (
                            <label key={day} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedDays.includes(day)}
                                onChange={() => handleDaySelect(day)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                {day}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Selected filters tags */}
          {(selectedBrands.length > 0 || selectedDays.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
              {selectedBrands.map(brand => (
                <span
                  key={brand}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
                >
                  {brand}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBrandSelect(brand);
                    }}
                    className="ml-1 inline-flex items-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {selectedDays.map(day => (
                <span
                  key={day}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                >
                  {getAbbreviatedDay(day)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDaySelect(day);
                    }}
                    className="ml-1 inline-flex items-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center text-gray-500 dark:text-gray-400">Cargando descuentos...</div>
          </div>
        ) : descuentos.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center text-gray-500 dark:text-gray-400">No se encontraron descuentos</div>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('marca_combustible')}
                      >
                        <div className="flex items-center gap-1">
                          Marca
                          {getSortIcon('marca_combustible')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('dia')}
                      >
                        <div className="flex items-center gap-1">
                          Día
                          {getSortIcon('dia')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Método de Pago
                      </th>
                      <th 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('descuento')}
                      >
                        <div className="flex items-center gap-1">
                          Descuento
                          {getSortIcon('descuento')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('limite_reintegro')}
                      >
                        <div className="flex items-center gap-1">
                          Límite de Reintegro
                          {getSortIcon('limite_reintegro')}
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Frecuencia
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {descuentos.map((descuento) => (
                      <tr key={descuento.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {getBrandIcon(descuento.marca_combustible)}
                            {descuento.marca_combustible}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{descuento.dia}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{descuento.metodo_pago}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDiscountBadgeStyle(descuento.descuento)}`}>
                              {descuento.descuento}%
                            </span>
                            <FlagButton
                              onClick={() => {
                                setSelectedDiscountForReport(descuento);
                                setIsReportModalOpen(true);
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getReimburseLimitStyle(descuento.limite_reintegro)}`}>
                            ${descuento.limite_reintegro.toLocaleString('es-AR').replace(/\./g, ',')}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{descuento.frecuencia}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden grid gap-4 sm:grid-cols-2">
              {descuentos.map((descuento) => (
                <div
                  key={descuento.id}
                  className="bg-white rounded-lg shadow-sm transform transition-all duration-200 hover:shadow-md relative"
                >
                  <div className={`bg-gradient-to-r ${getBrandColor(descuento.marca_combustible)} p-4 overflow-visible`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {getBrandIcon(descuento.marca_combustible)}
                          {descuento.marca_combustible}
                        </h3>
                        <p className="text-gray-700 text-sm mt-1">{descuento.dia}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center rounded-lg px-3 py-1.5 ${getDiscountBadgeStyle(descuento.descuento)}`}>
                          <span className="text-lg font-bold">{descuento.descuento}%</span>
                        </div>
                        <FlagButton
                          onClick={() => {
                            setSelectedDiscountForReport(descuento);
                            setIsReportModalOpen(true);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Método de Pago</p>
                        <p className="text-sm text-gray-600">{descuento.metodo_pago}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Límite de Reintegro</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getReimburseLimitStyle(descuento.limite_reintegro)}`}>
                          ${descuento.limite_reintegro.toLocaleString('es-AR').replace(/\./g, ',')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Frequency</p>
                        <p className="text-sm text-gray-600">{descuento.frecuencia}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Recommend Modal */}
      {isRecommendModalOpen && (
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsRecommendModalOpen(false);
            }
          }}
        >
          <div 
            ref={modalRef} 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out animate-modal-slide-in"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recomendar Nuevo Descuento</h2>
                <button
                  onClick={() => setIsRecommendModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleRecommendSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Marca de Combustible <span className="text-red-500">*</span>
                  </label>
                  <div className="relative" ref={recommendBrandDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setRecommendBrandDropdownOpen(!recommendBrandDropdownOpen)}
                      className="mt-1 relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <span className="block truncate">
                        {recommendFormData.marca_combustible.length === 0 
                          ? 'Seleccionar marcas' 
                          : recommendFormData.marca_combustible.join(', ')}
                      </span>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </span>
                    </button>
                    
                    {recommendBrandDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        <div className="p-2">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Select Brands</span>
                            {recommendFormData.marca_combustible.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setRecommendFormData(prev => ({ ...prev, marca_combustible: [] }))}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Limpiar selección
                              </button>
                            )}
                          </div>
                          {brands.map(brand => (
                            <label key={brand} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={recommendFormData.marca_combustible.includes(brand)}
                                onChange={() => toggleRecommendBrand(brand)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700 flex items-center">
                                {getBrandIcon(brand)}
                                {brand}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Días <span className="text-red-500">*</span>
                  </label>
                  <div className="relative" ref={recommendDayDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setRecommendDayDropdownOpen(!recommendDayDropdownOpen)}
                      className="mt-1 relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <span className="block truncate">
                        {recommendFormData.dia.length === 0 
                          ? 'Seleccionar días' 
                          : recommendFormData.dia.map(day => getAbbreviatedDay(day)).join(', ')}
                      </span>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </span>
                    </button>
                    
                    {recommendDayDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        <div className="p-2">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Select Days</span>
                            {recommendFormData.dia.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setRecommendFormData(prev => ({ ...prev, dia: [] }))}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Limpiar selección
                              </button>
                            )}
                          </div>
                          {days.map(day => (
                            <label key={day} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={recommendFormData.dia.includes(day)}
                                onChange={() => toggleRecommendDay(day)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Método de Pago <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recommendFormData.metodo_pago}
                    onChange={(e) => setRecommendFormData(prev => ({ ...prev, metodo_pago: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Visa / Mastercard / Modo"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Porcentaje de Descuento <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="text"
                      value={recommendFormData.descuento}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Ingrese el porcentaje"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Límite de Reintegro <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="text"
                      value={recommendFormData.limite_reintegro}
                      onChange={(e) => handleReimbursementLimitChange(e.target.value)}
                      disabled={recommendFormData.sin_limite_reintegro}
                      className={`block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        recommendFormData.sin_limite_reintegro ? 'bg-gray-100 text-gray-500' : ''
                      }`}
                      placeholder="Ej: 5,000 (máx: 1,000,000)"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={recommendFormData.sin_limite_reintegro}
                        onChange={(e) => {
                          setRecommendFormData(prev => ({
                            ...prev,
                            sin_limite_reintegro: e.target.checked,
                            limite_reintegro: e.target.checked ? '' : prev.limite_reintegro
                          }));
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600">Sin límite de reintegro</span>
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Frecuencia <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={recommendFormData.frecuencia}
                    onChange={(e) => setRecommendFormData(prev => ({ ...prev, frecuencia: e.target.value }))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Seleccionar frecuencia</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    URL de Origen
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <div className="relative flex items-stretch flex-grow focus-within:z-10">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Link className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={recommendFormData.url_fuente}
                        onChange={(e) => setRecommendFormData(prev => ({ ...prev, url_fuente: e.target.value }))}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-10 pr-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="https://ejemplo.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isRecommendButtonDisabled}
                    className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      isRecommendButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isRecommendButtonDisabled ? 'Enviando...' : 'Recomendar Descuento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add the report modal */}
      {selectedDiscountForReport && (
        <ReportErrorModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedDiscountForReport(null);
          }}
          discountId={selectedDiscountForReport.id}
          onSubmit={handleReportSubmit}
        />
      )}

      {/* Add Toast */}
      {toast && (
        <Toast
          mensaje={toast.mensaje}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;