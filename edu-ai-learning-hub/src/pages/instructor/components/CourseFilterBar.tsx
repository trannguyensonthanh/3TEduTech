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
    <div className='space-y-4'>
      <div className='relative group'>
        <Icons.search className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
        <Input
          placeholder='Tìm kiếm khóa học của bạn theo tên...'
          className='pl-10 h-11 rounded-xl border border-border bg-card text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring transition-colors'
          value={filters.searchTerm}
          onChange={(e) => updateFilter('searchTerm', e.target.value)}
        />
        {filters.searchTerm && (
          <button
            onClick={() => updateFilter('searchTerm', '')}
            className='absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors'
          >
            <Icons.x className='h-3.5 w-3.5' />
          </button>
        )}
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
        <Select
          value={filters.statusId || 'ALL'}
          onValueChange={(value) => handleSelectChange('statusId', value)}
          disabled={isLoadingStatuses}
        >
          <SelectTrigger className='h-11 rounded-xl border border-border bg-card font-medium hover:border-primary/40 transition-colors'>
            <div className='flex items-center gap-2'>
              <Icons.filter className='h-3.5 w-3.5 text-muted-foreground' />
              <SelectValue placeholder='Trạng thái' />
            </div>
          </SelectTrigger>
          <SelectContent className='rounded-xl border border-border bg-popover'>
            <SelectItem value='ALL' className='font-semibold'>
              Tất cả trạng thái
            </SelectItem>
            {statusesData?.map((status) => (
              <SelectItem key={status.statusId} value={status.statusId} className='font-medium'>
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
          <SelectTrigger className='h-11 rounded-xl border border-border bg-card font-medium hover:border-primary/40 transition-colors'>
            <div className='flex items-center gap-2 truncate'>
              <Icons.layers className='h-3.5 w-3.5 text-muted-foreground' />
              <SelectValue placeholder='Danh mục' />
            </div>
          </SelectTrigger>
          <SelectContent className='rounded-xl border border-border bg-popover max-h-72'>
            <SelectItem value='ALL' className='font-semibold'>
              Tất cả danh mục
            </SelectItem>
            {categoriesData?.categories.map((cat) => (
              <SelectItem
                key={cat.categoryId}
                value={cat.categoryId.toString()}
                className='font-medium'
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
          <SelectTrigger className='h-11 rounded-xl border border-border bg-card font-medium hover:border-primary/40 transition-colors'>
            <div className='flex items-center gap-2'>
              <Icons.certificate className='h-3.5 w-3.5 text-muted-foreground' />
              <SelectValue placeholder='Cấp độ' />
            </div>
          </SelectTrigger>
          <SelectContent className='rounded-xl border border-border bg-popover'>
            <SelectItem value='ALL' className='font-semibold'>
              Tất cả cấp độ
            </SelectItem>
            {levelsData?.levels.map((level) => (
              <SelectItem key={level.levelId} value={level.levelId.toString()} className='font-medium'>
                {level.levelName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters ? (
          <Button
            variant='destructive'
            onClick={clearFilters}
            className='h-11 rounded-xl text-xs font-bold transition-colors'
          >
            <Icons.x className='mr-2 h-4 w-4 stroke-[2.5]' /> Xóa tất cả bộ lọc
          </Button>
        ) : (
          <div className='hidden lg:flex items-center justify-end pr-2 text-xs font-medium text-muted-foreground opacity-75'>
            <span>Bộ lọc nhanh</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseFilterBar;
