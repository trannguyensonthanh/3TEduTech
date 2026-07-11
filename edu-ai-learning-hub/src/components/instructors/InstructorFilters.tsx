// src/components/instructors/InstructorFilters.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/common/Icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Skill } from '@/services/skill.service'; // Skill interface từ skill.service
import { InstructorQueryParams } from '@/services/instructor.service';
import { RATING_OPTIONS } from '../courses/CourseFiltersSidebar'; // Tái sử dụng RATING_OPTIONS
import { cn } from '@/lib/utils';

type InstructorFilterKey = Omit<
  InstructorQueryParams,
  'page' | 'limit' | 'sortBy' | 'searchTerm'
>;

interface InstructorFiltersProps {
  filters: InstructorFilterKey;
  onFilterChange: <K extends keyof InstructorFilterKey>(
    key: K,
    value: InstructorFilterKey[K] | null
  ) => void;
  onResetFilters: () => void;
  skills?: Pick<Skill, 'skillId' | 'skillName'>[]; // Danh sách skills cho filter
  isLoadingSkills: boolean;
  className?: string;
}

const FilterSkeleton: React.FC<{ items?: number }> = ({ items = 3 }) => (
  <div className="space-y-2.5 pt-1">
    {Array.from({ length: items }).map((_, i) => (
      <Skeleton key={i} className="h-8 w-full" />
    ))}
  </div>
);

export const InstructorFilters: React.FC<InstructorFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  skills = [],
  isLoadingSkills,
  className,
}) => {
  const isAnyFilterActive = Object.values(filters).some(
    (value) => value !== null && value !== undefined
  );

  const ALL_SKILLS_VALUE = 'all_skills_sentinel'; // Define a constant for the special value

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
          Filter Instructors
        </h3>
        {isAnyFilterActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-xs h-auto py-1 px-2 text-muted-foreground hover:text-primary"
          >
            <Icons.listRestart size={14} className="mr-1" /> Reset
          </Button>
        )}
      </div>

      <Accordion
        type="multiple"
        defaultValue={['specialization', 'rating']}
        className="w-full"
      >
        {/* Specialization/Skill Filter */}
        <AccordionItem value="specialization">
          <AccordionTrigger className="py-3.5 text-base font-medium hover:no-underline">
            Specialization
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            {isLoadingSkills ? (
              <FilterSkeleton items={5} />
            ) : (
              <Select
                value={
                  filters.skillId
                    ? filters.skillId.toString()
                    : ALL_SKILLS_VALUE // Use sentinel when no skillId is selected
                }
                onValueChange={(selectedValue) => {
                  if (selectedValue === ALL_SKILLS_VALUE) {
                    onFilterChange('skillId', null); // Clear filter if sentinel is selected
                  } else {
                    onFilterChange(
                      'skillId',
                      selectedValue ? Number(selectedValue) : null
                    );
                  }
                }}
              >
                <SelectTrigger className="w-full text-sm h-11">
                  <SelectValue placeholder="All Specializations" />
                </SelectTrigger>
                <SelectContent>
                  {/* Use the sentinel value for "All Specializations" and provide a key */}
                  <SelectItem key={ALL_SKILLS_VALUE} value={ALL_SKILLS_VALUE}>
                    All Specializations
                  </SelectItem>
                  {skills.map((skill) => (
                    <SelectItem
                      key={skill?.skillId} // Ensure skillId is always unique and present
                      value={skill?.skillId?.toString()} // Ensure this is a non-empty string
                    >
                      {skill?.skillName}
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
            {RATING_OPTIONS.map((option) => (
              <div
                key={`inst-rating-${option.value}`}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={`inst-rating-filter-${option.value}`}
                  checked={filters.minRating === option.value}
                  onCheckedChange={(checked) =>
                    onFilterChange('minRating', checked ? option.value : null)
                  }
                />
                <Label
                  htmlFor={`inst-rating-filter-${option.value}`}
                  className="flex items-center text-sm font-normal cursor-pointer hover:text-primary"
                >
                  {/* ... (render stars giống CourseFiltersSidebar) ... */}
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
                            : 'fill-yellow-400 text-yellow-400'
                          : 'fill-muted stroke-muted-foreground text-muted-foreground'
                      }`}
                    />
                  ))}
                  <span className="ml-1.5">{option.label}</span>
                </Label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Có thể thêm filter theo số lượng khóa học, số lượng học viên nếu API hỗ trợ */}
      </Accordion>
    </div>
  );
};
