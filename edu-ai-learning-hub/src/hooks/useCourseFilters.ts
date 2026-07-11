// src/hooks/useCourseFilters.ts
import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from './useDebounce'; // Giả sử bạn có hook này

// Định nghĩa các type cho rõ ràng
export type CourseStatusFilter =
  | 'DRAFT'
  | 'PENDING'
  | 'PUBLISHED'
  | 'REJECTED'
  | null;

export interface CourseFilterState {
  searchTerm: string;
  statusId: CourseStatusFilter;
  categoryId: number | null;
  levelId: number | null;
}

export interface CourseQueryParams {
  page: number;
  limit: number;
  instructorId: number; // Luôn cần instructorId trong context này
  searchTerm?: string;
  statusId?: CourseStatusFilter;
  categoryId?: number | null;
  levelId?: number | null;
  sortBy: string;
}

export const useInstructorCourseFilters = (
  instructorId: number,
  initialLimit = 6
) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<CourseFilterState>({
    searchTerm: '',
    statusId: null, // Mặc định là 'All'
    categoryId: null,
    levelId: null,
  });

  const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);

  const updateFilter = useCallback(
    <K extends keyof CourseFilterState>(
      key: K,
      value: CourseFilterState[K]
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      statusId: null,
      categoryId: null,
      levelId: null,
    });
    setCurrentPage(1);
  }, []);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const queryParams: CourseQueryParams = useMemo(
    () => ({
      page: currentPage,
      limit: initialLimit,
      instructorId: instructorId,
      searchTerm: debouncedSearchTerm || undefined,
      statusId: filters.statusId || undefined,
      categoryId: filters.categoryId || undefined,
      levelId: filters.levelId || undefined,
      sortBy: 'updatedAt:desc', // Sắp xếp theo cập nhật mới nhất
    }),
    [currentPage, initialLimit, instructorId, debouncedSearchTerm, filters]
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
