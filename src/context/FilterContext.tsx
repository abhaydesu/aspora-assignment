import React, { createContext, useContext, useState } from 'react';

export interface FilterState {
  status: string;
  role: string;
}

interface FilterContextType {
  filters: FilterState;
  updateFilter: (key: keyof FilterState, value: string) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType | null>(null);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    role: '',
  });

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prevFilter => ({
      ...prevFilter,
      [key] : value
    }));
  };

  const clearFilters = () => setFilters({ status: '', role: '' });

  return (
    <FilterContext.Provider value={{ filters, updateFilter, clearFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export function useFilters(): FilterContextType {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within a FilterProvider');
  return ctx;
}
