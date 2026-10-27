import { useState, useCallback } from 'react';

const INITIAL_FILTERS = {
  exams: true,
  holidays: true,
  online: true,
  offline: true,
  oncampus: true,
  offcampus: true,
  worksite: true,
};

export function useCalendarFilters() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const toggleFilter = useCallback((key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: Boolean(value),
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  return {
    filters,
    toggleFilter,
    setFilter,
    resetFilters,
  };
}
