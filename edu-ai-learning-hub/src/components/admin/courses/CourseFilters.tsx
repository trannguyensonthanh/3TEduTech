/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/admin/courses/CourseFilters.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/common/Icons';
import { useCategories } from '@/hooks/queries/category.queries';
import { useCourseStatuses } from '@/hooks/queries/course.queries';
import { AdminCourseFilterState } from '@/hooks/useAdminCourseFilters';

interface CourseFiltersProps {
  filters: AdminCourseFilterState;
  updateFilter: <K extends keyof AdminCourseFilterState>(
    key: K,
    value: AdminCourseFilterState[K]
  ) => void;
  clearFilters: () => void;
}

const AdminCourseFilters: React.FC<CourseFiltersProps> = ({
  filters,
  updateFilter,
  clearFilters,
}) => {
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories({ limit: 0 });
  const { data: statusesData, isLoading: isLoadingStatuses } =
    useCourseStatuses();

  const handleSelectChange = (
    key: 'categoryId' | 'statusId',
    value: string
  ) => {
    const finalValue =
      value === 'ALL' ? null : key === 'categoryId' ? Number(value) : value;
    updateFilter(key, finalValue as any);
  };

  const hasActiveFilters = filters.categoryId || filters.statusId;

  return (
    <div className='p-4 bg-card border rounded-lg space-y-4'>
      <div className='relative'>
        <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Search by course title, ID, or instructor...'
          className='pl-10 h-10'
          value={filters.searchTerm}
          onChange={(e) => updateFilter('searchTerm', e.target.value)}
        />
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Select
          value={filters.categoryId?.toString() || 'ALL'}
          onValueChange={(v) => handleSelectChange('categoryId', v)}
          disabled={isLoadingCategories}
        >
          <SelectTrigger>
            <SelectValue placeholder='All Categories' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>All Categories</SelectItem>
            {categoriesData?.categories.map((cat) => (
              <SelectItem key={cat.categoryId} value={String(cat.categoryId)}>
                {cat.categoryName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.statusId || 'ALL'}
          onValueChange={(v) => handleSelectChange('statusId', v)}
          disabled={isLoadingStatuses}
        >
          <SelectTrigger>
            <SelectValue placeholder='All Statuses' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>All Statuses</SelectItem>
            {statusesData?.map((status) => (
              <SelectItem key={status.statusId} value={status.statusId}>
                {status.statusName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant='ghost'
            onClick={clearFilters}
            className='lg:col-start-4'
          >
            <Icons.x className='mr-2 h-4 w-4' /> Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default AdminCourseFilters;
