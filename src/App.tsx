import React, { useEffect, useState, useRef } from 'react';
import Filter from 'lucide-react/dist/esm/icons/filter';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Clock from 'lucide-react/dist/esm/icons/clock';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Percent from 'lucide-react/dist/esm/icons/percent';
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
import { ReportErrorModal, type ReportErrorData } from './components/ReportErrorModal';
import type { Discount, FuelBrand } from './types';
import { Toast } from './components/Toast';

type SortField = 'discount' | 'reimbursement_limit' | 'fuel_brand' | 'day' | null;
type SortDirection = 'asc' | 'desc';

interface RecommendFormData {
  fuel_brand: string[];
  day: string[];
  card_method: string;
  discount: string;
  reimbursement_limit: string;
  frequency: string;
  source_url: string;
}

function App() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [dayDropdownOpen, setDayDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isRecommendButtonDisabled, setIsRecommendButtonDisabled] = useState(false);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const [recommendFormData, setRecommendFormData] = useState<RecommendFormData>({
    fuel_brand: [],
    day: [],
    card_method: '',
    discount: '',
    reimbursement_limit: '',
    frequency: '',
    source_url: ''
  });
  const [selectedDiscountForReport, setSelectedDiscountForReport] = useState<Discount | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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
      return 'bg-purple-100 text-purple-800 ring-1 ring-purple-600/20';
    } else if (percentage > 10) {
      return 'bg-green-100 text-green-800 ring-1 ring-green-600/20';
    }
    return 'bg-blue-100 text-blue-800 ring-1 ring-blue-600/20';
  };

  const getReimburseLimitStyle = (limit: number): string => {
    if (limit > 10000) {
      return 'bg-purple-100 text-purple-800 ring-1 ring-purple-600/20';
    } else if (limit > 5000) {
      return 'bg-green-100 text-green-800 ring-1 ring-green-600/20';
    }
    return 'bg-blue-100 text-blue-800 ring-1 ring-blue-600/20';
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
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '' || parseInt(numericValue) <= 100) {
      setRecommendFormData(prev => ({ ...prev, discount: numericValue }));
    }
  };

  const handleReimbursementLimitChange = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    // Format with thousand separators
    const formattedValue = numericValue ? parseInt(numericValue).toLocaleString() : '';
    setRecommendFormData(prev => ({ ...prev, reimbursement_limit: formattedValue }));
  };

  const formatNumber = (value: string) => {
    return value ? Number(value).toLocaleString() : '';
  };

  const toggleRecommendDay = (day: string) => {
    setRecommendFormData(prev => {
      const newDays = prev.day.includes(day)
        ? prev.day.filter((d: string) => d !== day)
        : [...prev.day, day];
      
      // If "Todos los días" is selected, clear other selections
      if (day === 'Todos los días') {
        return { ...prev, day: newDays.includes('Todos los días') ? ['Todos los días'] : [] };
      }
      
      // If another day is selected and "Todos los días" was previously selected, remove it
      if (prev.day.includes('Todos los días')) {
        return { ...prev, day: [day] };
      }
      
      return { ...prev, day: newDays };
    });
  };

  const handleSearch = (value: string) => {
    try {
      // Sanitize the search input by removing special characters and limiting length
      const sanitizedValue = value
        .replace(/[^\w\s]/g, '') // Remove special characters, keep only words and spaces
        .trim()
        .slice(0, 100); // Limit length to 100 characters
      setSearchQuery(sanitizedValue);
      // No need to call fetchDiscounts here as it's triggered by the useEffect
    } catch (error) {
      console.error('Error in search input:', error);
      setError('Invalid search input. Please try again.');
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [selectedBrands, selectedDays, sortField, sortDirection, searchQuery]);

  async function fetchDiscounts() {
    try {
      setLoading(true);
      setError(null);

      // Build the data query
      let query = supabase
        .from('discounts')
        .select('*');

      // Apply brand filter
      if (selectedBrands.length > 0) {
        query = query.in('fuel_brand', selectedBrands);
      }

      // Apply day filter
      if (selectedDays.length > 0) {
        const dayConditions = selectedDays.map(day => {
          if (day === 'Todos los días') {
            return `day.ilike.%${day}%`;
          }
          return `day.ilike.%${day}%`;
        });
        query = query.or(dayConditions.join(','));
      }

      // Apply search query if present and valid
      if (searchQuery.trim()) {
        const searchTerm = searchQuery.toLowerCase().trim();
        // Validate search term length and content
        if (searchTerm.length <= 100 && /^[\w\s]*$/.test(searchTerm)) {
          // Create a search filter that looks in all relevant fields
          query = query.or(
            `card_method.ilike.%${searchTerm}%,` +
            `frequency.ilike.%${searchTerm}%`
          );
          
          // If no brand filter is active, also search in fuel_brand
          if (selectedBrands.length === 0) {
            query = query.or(`fuel_brand.ilike.%${searchTerm}%`);
          }
          
          // If no day filter is active, also search in day
          if (selectedDays.length === 0) {
            query = query.or(`day.ilike.%${searchTerm}%`);
          }
        } else {
          throw new Error('Invalid search input. Please use only letters, numbers, and spaces.');
        }
      }

      // Apply sorting
      if (sortField) {
        query = query.order(sortField, { ascending: sortDirection === 'asc' });
      }

      // Execute the query
      const { data, error } = await query;
      
      if (error) throw error;

      setDiscounts(data || []);
    } catch (error) {
      console.error('Error fetching discounts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch discounts');
      setDiscounts([]); // Clear discounts on error
    } finally {
      setLoading(false);
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
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

    if (recommendFormData.fuel_brand.length === 0 || !recommendFormData.card_method || !recommendFormData.discount || recommendFormData.day.length === 0) {
      setToast({ message: 'Please fill in all required fields and select at least one day', type: 'error' });
      return;
    }

    // Disable the button during submission
    setIsRecommendButtonDisabled(true);

    try {
      const { data, error } = await supabase
        .from('recommended_discounts')
        .insert({
          fuel_brand: recommendFormData.fuel_brand[0], // Taking first selected brand
          days: recommendFormData.day,
          payment_method: recommendFormData.card_method,
          discount_percentage: parseInt(recommendFormData.discount),
          reimbursement_limit: parseInt(recommendFormData.reimbursement_limit.replace(/,/g, '')),
          frequency: recommendFormData.frequency,
          source_url: recommendFormData.source_url || null,
          status: 'pending'
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        setToast({ message: `Error submitting recommendation: ${error.message}`, type: 'error' });
        throw error;
      }

      setToast({ message: 'Discount recommended successfully!', type: 'success' });
      setIsRecommendModalOpen(false);
      setRecommendFormData({
        fuel_brand: [],
        day: [],
        card_method: '',
        discount: '',
        reimbursement_limit: '',
        frequency: '',
        source_url: ''
      });
      startCooldown();
    } catch (error) {
      console.error('Error submitting recommendation:', error);
      if (error instanceof Error) {
        setToast({ message: `Error: ${error.message}`, type: 'error' });
      } else {
        setToast({ message: 'An unexpected error occurred while submitting the recommendation', type: 'error' });
      }
    } finally {
      setIsRecommendButtonDisabled(false);
    }
  };

  const toggleRecommendBrand = (brand: string) => {
    setRecommendFormData(prev => {
      const newBrands = prev.fuel_brand.includes(brand)
        ? prev.fuel_brand.filter(b => b !== brand)
        : [...prev.fuel_brand, brand];
      return { ...prev, fuel_brand: newBrands };
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
  const handleReportSubmit = async (data: ReportErrorData) => {
    try {
      await reportService.submitReport(data);
      setIsReportModalOpen(false);
      setSelectedDiscountForReport(null);
      setToast({ message: 'Error report submitted successfully!', type: 'success' });
    } catch (error) {
      if (error instanceof Error) {
        setToast({ message: error.message, type: 'error' });
      } else {
        setToast({ message: 'An unexpected error occurred', type: 'error' });
      }
      throw error;
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Fuel Discounts</h1>
            <button
              onClick={handleRecommendClick}
              disabled={isRecommendButtonDisabled}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isRecommendButtonDisabled 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isRecommendButtonDisabled 
                ? cooldownTimeLeft > 0 
                  ? `Please wait ${cooldownTimeLeft}s...` 
                  : 'Processing...'
                : 'Recommend Discount'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`bg-white p-2 sm:p-4 rounded-lg shadow-sm mb-6 sticky top-[73px] z-10 backdrop-blur-sm bg-white/95 transition-all duration-300 transform
          ${!showSearch ? 'sm:opacity-100 sm:translate-y-0 opacity-0 -translate-y-full pointer-events-none sm:pointer-events-auto' : 'opacity-100 translate-y-0'}`}>
          {/* Mobile layout */}
          <div className="flex flex-row items-center gap-2 sm:hidden">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search..."
                  className="block w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="relative" ref={mobileFilterRef}>
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="inline-flex items-center px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <Filter className="h-4 w-4 text-gray-400" />
                <ChevronDown className="h-4 w-4 ml-1 text-gray-400" />
              </button>

              {mobileFilterOpen && (
                <div className="absolute right-0 mt-1 w-72 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <div className="p-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Brands</label>
                      <div className="space-y-2">
                        {brands.map(brand => (
                          <label key={brand} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedBrands.includes(brand)}
                              onChange={(e) => handleBrandSelect(brand)}
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Days</label>
                      <div className="space-y-2">
                        {days.map(day => (
                          <label key={day} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedDays.includes(day)}
                              onChange={(e) => handleDaySelect(day)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden sm:block">
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search discounts, cards, brands..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="relative" ref={brandDropdownRef}>
                  <button
                    onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
                    className="flex items-center justify-between w-48 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <span className="truncate">
                      {selectedBrands.length === 0 
                        ? 'Select Brands'
                        : selectedBrands.join(', ')}
                    </span>
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </button>
                  {brandDropdownOpen && (
                    <div className="absolute mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                      <div className="p-2">
                        {brands.map(brand => (
                          <label key={brand} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedBrands.includes(brand)}
                              onChange={(e) => handleBrandSelect(brand)}
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

                <div className="relative" ref={dayDropdownRef}>
                  <button
                    onClick={() => setDayDropdownOpen(!dayDropdownOpen)}
                    className="flex items-center justify-between w-48 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <span className="truncate">
                      {selectedDays.length === 0 
                        ? 'Select Days'
                        : selectedDays.map(day => getAbbreviatedDay(day)).join(', ')}
                    </span>
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </button>
                  {dayDropdownOpen && (
                    <div className="absolute mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                      <div className="p-2">
                        {days.map(day => (
                          <label key={day} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedDays.includes(day)}
                              onChange={(e) => handleDaySelect(day)}
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
            </div>
          </div>

          {/* Selected filters tags */}
          {(selectedBrands.length > 0 || selectedDays.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
              {selectedBrands.map(brand => (
                <span
                  key={brand}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
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
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
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
            <div className="text-center text-gray-500">Loading discounts...</div>
          </div>
        ) : discounts.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center text-gray-500">No discounts found</div>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-hidden bg-white rounded-lg shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('fuel_brand')}
                      >
                        <div className="flex items-center gap-1">
                          Brand
                          {getSortIcon('fuel_brand')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('day')}
                      >
                        <div className="flex items-center gap-1">
                          Day
                          {getSortIcon('day')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('discount')}
                      >
                        <div className="flex items-center gap-1">
                          Discount
                          {getSortIcon('discount')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('reimbursement_limit')}
                      >
                        <div className="flex items-center gap-1">
                          Reimburse Limit
                          {getSortIcon('reimbursement_limit')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {discounts.map((discount) => (
                      <tr key={discount.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {getBrandIcon(discount.fuel_brand)}
                            {discount.fuel_brand}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">{discount.day}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">{discount.card_method}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDiscountBadgeStyle(discount.discount)}`}>
                              {discount.discount}%
                            </span>
                            <FlagButton
                              onClick={() => {
                                setSelectedDiscountForReport(discount);
                                setIsReportModalOpen(true);
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getReimburseLimitStyle(discount.reimbursement_limit)}`}>
                            ${discount.reimbursement_limit.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">{discount.frequency}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden grid gap-4 sm:grid-cols-2">
              {discounts.map((discount) => (
                <div
                  key={discount.id}
                  className="bg-white rounded-lg shadow-sm transform transition-all duration-200 hover:shadow-md relative"
                >
                  <div className={`bg-gradient-to-r ${getBrandColor(discount.fuel_brand)} p-4 overflow-visible`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {getBrandIcon(discount.fuel_brand)}
                          {discount.fuel_brand}
                        </h3>
                        <p className="text-gray-700 text-sm mt-1">{discount.day}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center rounded-lg px-3 py-1.5 ${getDiscountBadgeStyle(discount.discount)}`}>
                          <span className="text-lg font-bold">{discount.discount}%</span>
                        </div>
                        <FlagButton
                          onClick={() => {
                            setSelectedDiscountForReport(discount);
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
                        <p className="text-sm font-medium text-gray-900">Payment Method</p>
                        <p className="text-sm text-gray-600">{discount.card_method}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Reimburse Limit</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getReimburseLimitStyle(discount.reimbursement_limit)}`}>
                          ${discount.reimbursement_limit.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Frequency</p>
                        <p className="text-sm text-gray-600">{discount.frequency}</p>
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
                <h2 className="text-xl font-semibold text-gray-900">Recommend a New Discount</h2>
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
                    Fuel Brand *
                  </label>
                  <div className="relative" ref={recommendBrandDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setRecommendBrandDropdownOpen(!recommendBrandDropdownOpen)}
                      className="mt-1 relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <span className="block truncate">
                        {recommendFormData.fuel_brand.length === 0 
                          ? 'Select brands' 
                          : recommendFormData.fuel_brand.join(', ')}
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
                            {recommendFormData.fuel_brand.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setRecommendFormData(prev => ({ ...prev, fuel_brand: [] }))}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Clear all
                              </button>
                            )}
                          </div>
                          {brands.map(brand => (
                            <label key={brand} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={recommendFormData.fuel_brand.includes(brand)}
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
                    Days *
                  </label>
                  <div className="relative" ref={recommendDayDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setRecommendDayDropdownOpen(!recommendDayDropdownOpen)}
                      className="mt-1 relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <span className="block truncate">
                        {recommendFormData.day.length === 0 
                          ? 'Select days' 
                          : recommendFormData.day.map(day => getAbbreviatedDay(day)).join(', ')}
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
                            {recommendFormData.day.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setRecommendFormData(prev => ({ ...prev, day: [] }))}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Clear all
                              </button>
                            )}
                          </div>
                          {days.map(day => (
                            <label key={day} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={recommendFormData.day.includes(day)}
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
                    Payment Method *
                  </label>
                  <input
                    type="text"
                    value={recommendFormData.card_method}
                    onChange={(e) => setRecommendFormData(prev => ({ ...prev, card_method: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Visa / Mastercard / Modo"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Discount Percentage *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="text"
                      value={recommendFormData.discount}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter discount percentage"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Reimbursement Limit *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="text"
                      value={recommendFormData.reimbursement_limit}
                      onChange={(e) => handleReimbursementLimitChange(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter reimbursement limit"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Frequency *
                  </label>
                  <select
                    value={recommendFormData.frequency}
                    onChange={(e) => setRecommendFormData(prev => ({ ...prev, frequency: e.target.value }))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select frequency</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Source URL
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <div className="relative flex items-stretch flex-grow focus-within:z-10">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Link className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={recommendFormData.source_url}
                        onChange={(e) => setRecommendFormData(prev => ({ ...prev, source_url: e.target.value }))}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-10 pr-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="https://example.com"
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
                    {isRecommendButtonDisabled ? 'Submitting...' : 'Recommend Discount'}
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
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;