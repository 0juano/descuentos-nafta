import React, { useEffect, useState, useRef } from 'react';
import { Filter, CreditCard, Calendar, Clock, DollarSign, Percent, ChevronDown, X, ArrowUpDown, Search, Plus, Link } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Discount, FuelBrand } from './types';

type SortField = 'discount' | 'reimbursement_limit' | 'fuel_brand' | 'day' | null;
type SortDirection = 'asc' | 'desc';

interface RecommendFormData {
  fuel_brand: string;
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
  const [recommendFormData, setRecommendFormData] = useState<RecommendFormData>({
    fuel_brand: '',
    day: [],
    card_method: '',
    discount: '',
    reimbursement_limit: '',
    frequency: '',
    source_url: ''
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const dayDropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const brands = ['YPF', 'SHELL', 'AXION', 'Multiple'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Every day'];

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setBrandDropdownOpen(false);
      }
      if (dayDropdownRef.current && !dayDropdownRef.current.contains(event.target as Node)) {
        setDayDropdownOpen(false);
      }
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsRecommendModalOpen(false);
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
    const numericValue = value.replace(/[^0-9]/g, '');
    setRecommendFormData(prev => ({ ...prev, reimbursement_limit: numericValue }));
  };

  const formatNumber = (value: string) => {
    return value ? Number(value).toLocaleString() : '';
  };

  const toggleRecommendDay = (day: string) => {
    setRecommendFormData(prev => {
      const newDays = prev.day.includes(day)
        ? prev.day.filter(d => d !== day)
        : [...prev.day, day];
      
      // If "Every day" is selected, clear other selections
      if (day === 'Every day') {
        return { ...prev, day: newDays.includes('Every day') ? ['Every day'] : [] };
      }
      
      // If another day is selected and "Every day" was previously selected, remove it
      if (prev.day.includes('Every day')) {
        return { ...prev, day: [day] };
      }
      
      return { ...prev, day: newDays };
    });
  };

  useEffect(() => {
    fetchDiscounts();
  }, [selectedBrands, selectedDays, sortField, sortDirection]);

  async function fetchDiscounts() {
    try {
      setLoading(true);
      setError(null);
      let query = supabase.from('discounts').select('*');
      
      if (selectedBrands.length > 0) {
        query = query.in('fuel_brand', selectedBrands);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      let filteredData = data || [];
      
      if (selectedDays.length > 0) {
        filteredData = filteredData.filter(discount => {
          const discountDays = discount.day.split(' & ');
          return selectedDays.some(selectedDay => 
            discountDays.some(day => day.toLowerCase().includes(selectedDay.toLowerCase())) ||
            (discount.day === 'Every day' && selectedDays.includes('Every day'))
          );
        });
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredData = filteredData.filter(discount => 
          discount.fuel_brand.toLowerCase().includes(query) ||
          discount.day.toLowerCase().includes(query) ||
          discount.card_method.toLowerCase().includes(query) ||
          discount.frequency.toLowerCase().includes(query) ||
          discount.discount.toString().includes(query) ||
          discount.reimbursement_limit.toString().includes(query)
        );
      }

      if (sortField) {
        filteredData.sort((a, b) => {
          let comparison = 0;
          if (sortField === 'discount' || sortField === 'reimbursement_limit') {
            comparison = a[sortField] - b[sortField];
          } else {
            comparison = String(a[sortField]).localeCompare(String(b[sortField]));
          }
          return sortDirection === 'asc' ? comparison : -comparison;
        });
      }
      
      setDiscounts(filteredData);
    } catch (error) {
      console.error('Error fetching discounts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch discounts');
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

  const getBrandColor = (brand: string): string => {
    const colors: Record<string, string> = {
      'YPF': 'from-green-600 to-green-700',
      'SHELL': 'from-yellow-500 to-yellow-600',
      'AXION': 'from-purple-600 to-purple-700',
      'Multiple': 'from-blue-600 to-blue-700'
    };
    return colors[brand] || 'from-blue-600 to-blue-700';
  };

  const toggleBrand = (brand: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const toggleDay = (day: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const clearBrands = (event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedBrands([]);
  };

  const clearDays = (event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedDays([]);
  };

  const handleRecommendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('idle');

    if (!recommendFormData.fuel_brand || !recommendFormData.card_method || !recommendFormData.discount || recommendFormData.day.length === 0) {
      alert('Please fill in all required fields and select at least one day');
      return;
    }

    try {
      console.log('Recommendation submitted:', {
        ...recommendFormData,
        day: recommendFormData.day.join(' & ')
      });
      setSubmitStatus('success');
      setTimeout(() => {
        setIsRecommendModalOpen(false);
        setSubmitStatus('idle');
        setRecommendFormData({
          fuel_brand: '',
          day: [],
          card_method: '',
          discount: '',
          reimbursement_limit: '',
          frequency: '',
          source_url: ''
        });
      }, 2000);
    } catch (error) {
      console.error('Error submitting recommendation:', error);
      setSubmitStatus('error');
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
              onClick={() => setIsRecommendModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Recommend Discount
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 sticky top-[73px] z-10 backdrop-blur-sm bg-white/95">
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchDiscounts();
                }}
                placeholder="Search discounts, cards, brands..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
                      : `${selectedBrands.length} brand${selectedBrands.length === 1 ? '' : 's'}`}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </button>
                {brandDropdownOpen && (
                  <div className="absolute mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                    <div className="p-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Select Brands</span>
                        {selectedBrands.length > 0 && (
                          <button
                            onClick={(e) => clearBrands(e)}
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
                            checked={selectedBrands.includes(brand)}
                            onChange={(e) => toggleBrand(brand, e)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{brand}</span>
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
                      : `${selectedDays.length} day${selectedDays.length === 1 ? '' : 's'}`}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </button>
                {dayDropdownOpen && (
                  <div className="absolute mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                    <div className="p-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Select Days</span>
                        {selectedDays.length > 0 && (
                          <button
                            onClick={(e) => clearDays(e)}
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
                            checked={selectedDays.includes(day)}
                            onChange={(e) => toggleDay(day, e)}
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

          {(selectedBrands.length > 0 || selectedDays.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedBrands.map(brand => (
                <span
                  key={brand}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {brand}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBrand(brand, e);
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
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {day}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDay(day, e);
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
                          <span className="text-sm font-medium text-gray-900">{discount.fuel_brand}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">{discount.day}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">{discount.card_method}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDiscountBadgeStyle(discount.discount)}`}>
                            {discount.discount}%
                          </span>
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
                  className="bg-white rounded-lg shadow-sm overflow-hidden transform transition-all duration-200 hover:shadow-md"
                >
                  <div className={`bg-gradient-to-r ${getBrandColor(discount.fuel_brand)} p-4`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-white">{discount.fuel_brand}</h3>
                        <p className="text-white/90 text-sm mt-1">{discount.day}</p>
                      </div>
                      <div className={`flex items-center rounded-lg px-3 py-1.5 ${getDiscountBadgeStyle(discount.discount)}`}>
                        <span className="text-lg font-bold">{discount.discount}%</span>
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                  <select
                    value={recommendFormData.fuel_brand}
                    onChange={(e) => setRecommendFormData(prev => ({ ...prev, fuel_brand: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Select a brand</option>
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Days *
                  </label>
                  <div className="mt-2 space-y-2">
                    {days.map(day => (
                      <label key={day} className="flex items-center">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Method *
                  </label>
                  <input
                    type="text"
                    value={recommendFormData.card_method}
                    onChange={(e) => setRecommendFormData(prev => ({ ...prev, card_method: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., Visa Credit Card"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Discount ```jsx
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="text"
                      value={recommendFormData.discount}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      className="block w-full pr-8 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g., 15"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reimbursement Limit
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="text"
                      value={formatNumber(recommendFormData.reimbursement_limit)}
                      onChange={(e) => handleReimbursementLimitChange(e.target.value)}
                      className="block w-full pl-7 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g., 10,000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={recommendFormData.frequency}
                    onChange={(e) => setRecommendFormData(prev => ({ ...prev, frequency: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., Monthly"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Source URL
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Link className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="url"
                      value={recommendFormData.source_url}
                      onChange={(e) => setRecommendFormData(prev => ({ ...prev, source_url: e.target.value }))}
                      className="block w-full pl-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="https://example.com/discount"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Share where you found this discount
                  </p>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                      ${submitStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : 
                        submitStatus === 'error' ? 'bg-red-600 hover:bg-red-700' : 
                        'bg-indigo-600 hover:bg-indigo-700'} 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    {submitStatus === 'success' ? 'Submitted Successfully!' :
                     submitStatus === 'error' ? 'Error Submitting' :
                     'Submit Recommendation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;