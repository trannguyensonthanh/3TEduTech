// src/hooks/useAdminCourseFilters.ts
import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export interface AdminCourseFilterState {
  searchTerm: string;
  categoryId: number | null;
  statusId: string | null;
}

export const useAdminCourseFilters = (initialLimit = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<AdminCourseFilterState>({
    searchTerm: '',
    categoryId: null,
    statusId: null,
  });

  const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);

  const updateFilter = useCallback(
    <K extends keyof AdminCourseFilterState>(
      key: K,
      value: AdminCourseFilterState[K]
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({ searchTerm: '', categoryId: null, statusId: null });
    setCurrentPage(1);
  }, []);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: initialLimit,
      searchTerm: debouncedSearchTerm || undefined,
      categoryId: filters.categoryId || undefined,
      statusId: filters.statusId || undefined,
      sortBy: 'createdAt:desc',
    }),
    [currentPage, initialLimit, debouncedSearchTerm, filters]
  );

  return {
    currentPage,
    filters,
    queryParams,
    setPage,
    updateFilter,
    clearFilters,
  };
};
