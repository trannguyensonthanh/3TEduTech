// src/pages/instructor/components/CourseFilterBar.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { CourseFilterState } from '@/hooks/useCourseFilters';
import { useCategories } from '@/hooks/queries/category.queries';
import { useLevels } from '@/hooks/queries/level.queries';
import { useCourseStatuses } from '@/hooks/queries/course.queries';

interface CourseFilterBarProps {
  filters: CourseFilterState;
  updateFilter: <K extends keyof CourseFilterState>(
    key: K,
    value: CourseFilterState[K]
  ) => void;
  clearFilters: () => void;
}

const CourseFilterBar: React.FC<CourseFilterBarProps> = ({
  filters,
  updateFilter,
  clearFilters,
}) => {
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories({ limit: 100 });
  const { data: levelsData, isLoading: isLoadingLevels } = useLevels();
  const { data: statusesData, isLoading: isLoadingStatuses } =
    useCourseStatuses();

  const handleSelectChange = (
    key: 'statusId' | 'categoryId' | 'levelId',
    value: string
  ) => {
    if (value === 'ALL') {
      updateFilter(key, null);
    } else {
      updateFilter(
        key,
        key === 'statusId'
          ? (value as CourseFilterState['statusId'])
          : (Number(value) as CourseFilterState[typeof key])
      );
    }
  };

  const hasActiveFilters =
    filters.statusId || filters.categoryId || filters.levelId;

  return (
    <div className='space-y-3'>
      <div className='relative'>
        <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Search by course name...'
          className='pl-10'
          value={filters.searchTerm}
          onChange={(e) => updateFilter('searchTerm', e.target.value)}
        />
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
        <Select
          value={filters.statusId || 'ALL'}
          onValueChange={(value) => handleSelectChange('statusId', value)}
          disabled={isLoadingStatuses}
        >
          <SelectTrigger>
            <SelectValue placeholder='Status' />
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
        <Select
          value={filters.categoryId?.toString() || 'ALL'}
          onValueChange={(value) => handleSelectChange('categoryId', value)}
          disabled={isLoadingCategories}
        >
          <SelectTrigger>
            <SelectValue placeholder='Category' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>All Categories</SelectItem>
            {categoriesData?.categories.map((cat) => (
              <SelectItem
                key={cat.categoryId}
                value={cat.categoryId.toString()}
              >
                {cat.categoryName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.levelId?.toString() || 'ALL'}
          onValueChange={(value) => handleSelectChange('levelId', value)}
          disabled={isLoadingLevels}
        >
          <SelectTrigger>
            <SelectValue placeholder='Level' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>All Levels</SelectItem>
            {levelsData?.levels.map((level) => (
              <SelectItem key={level.levelId} value={level.levelId.toString()}>
                {level.levelName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant='ghost'
            onClick={clearFilters}
            className='text-sm text-muted-foreground hover:text-primary'
          >
            <Icons.x className='mr-2 h-4 w-4' /> Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default CourseFilterBar;
