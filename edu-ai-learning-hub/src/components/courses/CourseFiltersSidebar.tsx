/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/courses/CourseFiltersSidebar.tsx
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/common/Icons'; // Cần Filter, ListRestart, Star
import {
  CategoryFilterItem,
  LevelFilterItem,
  LanguageFilterItem,
  RatingFilterOption, // Sẽ định nghĩa
  PriceRangeFilter, // Sẽ định nghĩa
  BooleanFilterOption, // Sẽ định nghĩa
} from '@/types/filter.types'; // Tạo file types/filter.types.ts
import { CourseQueryParams } from '@/types/common.types'; // Import từ common.types.ts
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

// Định nghĩa các hằng số và kiểu dữ liệu có thể tái sử dụng
export const MAX_COURSE_PRICE = 200; // Hoặc lấy từ API/config

export const RATING_OPTIONS: RatingFilterOption[] = [
  { value: 4.5, label: '4.5 & Up', stars: 5 }, // stars: số sao hiển thị đầy đủ
  { value: 4, label: '4.0 & Up', stars: 4 },
  { value: 3.5, label: '3.5 & Up', stars: 4 }, // Ví dụ: 3.5 sao vẫn hiển thị 4 sao (3 đầy, 1 mờ/nửa)
  { value: 3, label: '3.0 & Up', stars: 3 },
];

export type CourseFilterKey = Omit<
  CourseQueryParams,
  'page' | 'limit' | 'sortBy' | 'searchTerm'
>;

interface CourseFiltersSidebarProps {
  filters: CourseFilterKey;
  onFilterChange: <K extends keyof CourseFilterKey>(
    key: K,
    value: CourseFilterKey[K] | null // Cho phép null để clear filter
  ) => void;
  onMultipleFiltersChange?: (changes: Partial<CourseFilterKey>) => void; // Cho phép thay đổi nhiều filter cùng lúc
  onResetFilters: () => void;
  categories?: CategoryFilterItem[];
  levels?: LevelFilterItem[];
  languages?: LanguageFilterItem[];
  isLoadingFilters: boolean; // Gộp các isLoading lại
  className?: string;
  currentContextCategoryId?: number | null;
}

const FilterSectionSkeleton: React.FC<{ items?: number }> = ({ items = 3 }) => (
  <div className="space-y-2.5 pt-1">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4 rounded-sm" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    ))}
  </div>
);

export const CourseFiltersSidebar: React.FC<CourseFiltersSidebarProps> = ({
  filters,
  onFilterChange,
  onMultipleFiltersChange,
  onResetFilters,
  categories = [],
  levels = [],
  languages = [],
  isLoadingFilters,
  className,
  currentContextCategoryId = null,
}) => {
  const handlePriceChange = (newRange: number[]) => {
    if (onMultipleFiltersChange) {
      onMultipleFiltersChange({
        minPrice: newRange[0] > 0 ? newRange[0] : undefined, // dùng undefined để clear
        maxPrice: newRange[1] < MAX_COURSE_PRICE ? newRange[1] : undefined,
      });
    } else {
      // Fallback nếu không có onMultipleFiltersChange
      onFilterChange('minPrice', newRange[0] > 0 ? newRange[0] : null);
      onFilterChange(
        'maxPrice',
        newRange[1] < MAX_COURSE_PRICE ? newRange[1] : null
      );
    }
  };

  const handleCheckboxChange = (
    filterKey: 'isFree' | 'isFeatured',
    checked: boolean | 'indeterminate'
  ) => {
    let valueToSet: boolean | number | null = null;
    if (filterKey === 'isFeatured') {
      valueToSet = checked === true ? 1 : null; // Chỉ 1 hoặc null
    } else {
      // isFree
      valueToSet = checked === true ? true : null;
    }
    onFilterChange(filterKey as any, valueToSet);
  };

  const isAnyFilterActive = useMemo(() => {
    // Kiểm tra các filter khác categoryId
    const otherFilters = { ...filters };
    if (currentContextCategoryId) delete (otherFilters as any).categoryId; // Bỏ qua categoryId nếu đang trong context

    return Object.entries(otherFilters).some(([key, value]) => {
      if (key === 'minPrice' && value === 0) return false;
      if (key === 'maxPrice' && value === MAX_COURSE_PRICE) return false;
      return value !== null && value !== undefined;
    });
  }, [filters, currentContextCategoryId]);
  return (
    <div
      className={cn(
        'space-y-6 lg:border lg:dark:border-slate-700 lg:p-5 lg:rounded-xl lg:shadow-sm lg:bg-card',
        className
      )}
    >
      <div className="flex justify-between items-center pb-2 border-b dark:border-slate-700">
        <h3 className="text-xl font-semibold text-foreground flex items-center">
          <Icons.filter className="w-5 h-5 mr-2.5 opacity-90" />
          Filter Courses
        </h3>
        {isAnyFilterActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-xs h-auto py-1 px-2 text-muted-foreground hover:text-primary dark:hover:text-primary"
          >
            <Icons.listRestart size={14} className="mr-1" /> Reset All
          </Button>
        )}
      </div>

      <Accordion
        type="multiple"
        defaultValue={['category', 'level', 'price', 'rating']} // Mở sẵn các mục quan trọng
        className="w-full"
      >
        {/* Category Filter */}
        {!currentContextCategoryId && categories.length > 0 && (
          <AccordionItem value="category">
            <AccordionTrigger className="py-3.5 text-base font-medium hover:no-underline">
              Category
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              {isLoadingFilters ? (
                <FilterSectionSkeleton items={5} />
              ) : (
                <RadioGroup
                  value={filters.categoryId?.toString() || ''} // Để rỗng nếu không có giá trị
                  onValueChange={(value) =>
                    onFilterChange('categoryId', value ? Number(value) : null)
                  }
                  className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="" id="cat-all-filter" />
                    <Label
                      htmlFor="cat-all-filter"
                      className="font-normal text-sm cursor-pointer hover:text-primary"
                    >
                      All Categories
                    </Label>
                  </div>
                  {categories.map((cat) => (
                    <div
                      key={cat.categoryId}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={cat.categoryId.toString()}
                        id={`cat-filter-${cat.categoryId}`}
                      />
                      <Label
                        htmlFor={`cat-filter-${cat.categoryId}`}
                        className="font-normal text-sm cursor-pointer hover:text-primary"
                      >
                        {cat.categoryName}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Level Filter */}
        <AccordionItem value="level">
          <AccordionTrigger className="py-3.5 text-base font-medium hover:no-underline">
            Level
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            {isLoadingFilters ? (
              <FilterSectionSkeleton items={4} />
            ) : (
              <RadioGroup
                value={filters.levelId?.toString()}
                onValueChange={(value) =>
                  onFilterChange('levelId', value ? Number(value) : null)
                }
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="level-all" />
                  <Label
                    htmlFor="level-all"
                    className="font-normal text-sm cursor-pointer hover:text-primary"
                  >
                    All Levels
                  </Label>
                </div>
                {levels.map((level) => (
                  <div
                    key={level.levelId}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem
                      value={level.levelId.toString()}
                      id={`level-${level.levelId}`}
                    />
                    <Label
                      htmlFor={`level-${level.levelId}`}
                      className="font-normal text-sm cursor-pointer hover:text-primary"
                    >
                      {level.levelName}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Price Filter */}
        <AccordionItem value="price">
          <AccordionTrigger className="py-3.5 text-base font-medium hover:no-underline">
            Price
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-3">
            <Slider
              min={0}
              max={MAX_COURSE_PRICE}
              step={10}
              value={[
                filters.minPrice || 0,
                filters.maxPrice ?? MAX_COURSE_PRICE,
              ]}
              onValueChange={handlePriceChange}
              className="my-2"
              minStepsBetweenThumbs={1} // Đảm bảo 2 thumb không trùng nhau
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>${filters.minPrice || 0}</span>
              <span>${filters.maxPrice ?? MAX_COURSE_PRICE}</span>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="free-courses-cb"
                checked={filters.isFree === true}
                onCheckedChange={(checked) =>
                  handleCheckboxChange('isFree', checked)
                }
              />
              <Label
                htmlFor="free-courses-cb"
                className="text-sm font-normal cursor-pointer hover:text-primary"
              >
                Only Free Courses
              </Label>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Language Filter */}
        <AccordionItem value="language">
          <AccordionTrigger className="py-3.5 text-base font-medium hover:no-underline">
            Language
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            {isLoadingFilters ? (
              <FilterSectionSkeleton items={3} />
            ) : (
              <Select
                value={filters.language || ''} // filters.language being null/undefined means placeholder shows
                onValueChange={(value) =>
                  // When the placeholder is selected, Radix typically passes an empty string or the placeholder value itself.
                  // We interpret an empty string as clearing the filter.
                  onFilterChange('language', value === '' ? null : value)
                }
              >
                <SelectTrigger className="w-full text-sm h-11">
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                  {/* REMOVED: <SelectItem value="">All Languages</SelectItem> */}
                  {/* Ensure lang.languageCode from your data is never an empty string */}
                  {languages.map((lang) => (
                    <SelectItem
                      key={lang.languageCode}
                      value={lang.languageCode} // This value must be a non-empty string
                    >
                      {lang.languageName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Rating Filter */}
        <AccordionItem value="rating">
          <AccordionTrigger className="py-3.5 text-base font-medium hover:no-underline">
            Minimum Rating
          </AccordionTrigger>
          <AccordionContent className="pt-3 space-y-2.5">
            <RadioGroup
              value={filters.minRating?.toString()}
              onValueChange={(value) =>
                onFilterChange('minRating', value ? Number(value) : null)
              }
              className="space-y-2.5"
            >
              {RATING_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value.toString()}
                    id={`rating-${option.value}`}
                    // onClick prop is removed as RadioGroup handles selection
                  />
                  <Label
                    htmlFor={`rating-${option.value}`}
                    className="flex items-center text-sm font-normal cursor-pointer hover:text-primary"
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icons.star
                        key={i}
                        size={16}
                        className={`mr-0.5 ${
                          i < Math.floor(option.value) ||
                          (i < Math.ceil(option.value) &&
                            option.value % 1 !== 0 &&
                            i === Math.floor(option.value))
                            ? i < Math.ceil(option.value) &&
                              option.value % 1 !== 0 &&
                              i === Math.floor(option.value)
                              ? 'text-yellow-400 fill-yellow-200'
                              : 'fill-yellow-400 text-yellow-400' // half star logic
                            : 'fill-muted stroke-muted-foreground text-muted-foreground'
                        }`}
                      />
                    ))}
                    <span className="ml-1.5">{option.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        {/* Other Filters (Featured) */}
        <AccordionItem value="others">
          <AccordionTrigger className="py-3.5 text-base font-medium hover:no-underline">
            Others
          </AccordionTrigger>
          <AccordionContent className="pt-3 space-y-2.5">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured-cb"
                // isFeatured là 1 hoặc 0 hoặc null/undefined
                checked={filters.isFeatured === 1}
                onCheckedChange={(checked) =>
                  onFilterChange('isFeatured', checked === true ? 1 : null)
                } // null để bỏ filter
              />
              <Label
                htmlFor="featured-cb"
                className="text-sm font-normal cursor-pointer hover:text-primary"
              >
                Only Featured Courses
              </Label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
