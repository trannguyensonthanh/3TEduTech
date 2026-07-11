// src/components/search/SearchCommandDialog.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'; // Từ shadcn/ui
import { Icons } from '@/components/common/Icons'; // Cần icons cho Course, User, Category
import { useDebounce } from '@/hooks/useDebounce';
// Giả sử bạn có các hooks để fetch gợi ý tìm kiếm
// Ví dụ:
// import { useSearchSuggestions } from '@/hooks/queries/search.queries';
// Hoặc chúng ta sẽ dùng các hook hiện có và filter ở client cho demo này trước
import { useCourses } from '@/hooks/queries/course.queries';

import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useInstructors } from '@/hooks/queries/instructor.queries';
import { useCategories } from '@/hooks/queries/category.queries';

interface SearchResultItem {
  id: string | number;
  type: 'course' | 'instructor' | 'category' | 'page';
  title: string;
  description?: string;
  icon?: React.ReactNode;
  url: string;
  imageUrl?: string | null; // Cho avatar instructor hoặc thumbnail course
}

interface SearchCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_RESULTS_PER_GROUP = 3; // Số lượng kết quả tối đa cho mỗi nhóm

export const SearchCommandDialog: React.FC<SearchCommandDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const debouncedSearchTerm = useDebounce(inputValue, 300);

  // Fetch data (ví dụ lấy một lượng nhỏ để làm search client-side cho demo,
  // hoặc API search thực sự sẽ tốt hơn cho production)
  const { data: coursesData, isLoading: isLoadingCourses } = useCourses(
    { limit: 50, searchTerm: debouncedSearchTerm, userPage: true },
    { enabled: !!debouncedSearchTerm }
  );
  const { data: instructorsData, isLoading: isLoadingInstructors } =
    useInstructors(
      { limit: 20, searchTerm: debouncedSearchTerm },
      { enabled: !!debouncedSearchTerm }
    );
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories(
      { limit: 20, searchTerm: debouncedSearchTerm },
      { enabled: !!debouncedSearchTerm }
    );

  const isLoading =
    isLoadingCourses || isLoadingInstructors || isLoadingCategories;

  const allResults = useMemo(() => {
    if (!debouncedSearchTerm) return [];
    const results: SearchResultItem[] = [];

    // Courses
    (coursesData?.courses || [])
      .slice(0, MAX_RESULTS_PER_GROUP)
      .forEach((course) => {
        results.push({
          id: `course-${course.courseId}`,
          type: 'course',
          title: course.courseName,
          description: `By ${course.instructorName} • ${
            course.levelName || ''
          }`,
          icon: <Icons.course className="mr-2 h-4 w-4 opacity-80" />, // Giả sử có Icons.course
          url: `/courses/${course.slug}`,
          imageUrl: course.thumbnailUrl,
        });
      });

    // Instructors
    (instructorsData?.instructors || [])
      .slice(0, MAX_RESULTS_PER_GROUP)
      .forEach((instructor) => {
        results.push({
          id: `instructor-${instructor.accountId}`,
          type: 'instructor',
          title: instructor.fullName,
          description: instructor.professionalTitle || 'Instructor',
          icon: <Icons.user className="mr-2 h-4 w-4 opacity-80" />,
          url: `/instructors/${instructor.slug || instructor.accountId}`,
          imageUrl: instructor.avatarUrl,
        });
      });

    // Categories
    (categoriesData?.categories || [])
      .slice(0, MAX_RESULTS_PER_GROUP)
      .forEach((category) => {
        results.push({
          id: `category-${category.categoryId}`,
          type: 'category',
          title: category.categoryName,
          description: `${category.courseCount || 0} courses`,
          icon: <Icons.folder className="mr-2 h-4 w-4 opacity-80" />, // Đổi sang Icons.folder (hoặc icon phù hợp khác)
          url: `/categories/${category.slug}`,
          imageUrl: category.iconUrl, // Ảnh đại diện của category
        });
      });

    // Có thể thêm các link trang tĩnh nếu muốn
    // Ví dụ:
    // const staticPages = [
    //   { title: 'About Us', url: '/about', icon: <Icons.info className="mr-2 h-4 w-4 opacity-80" /> },
    //   { title: 'All Courses', url: '/courses', icon: <Icons.course className="mr-2 h-4 w-4 opacity-80" /> },
    // ];
    // staticPages.forEach(page => {
    //   if (page.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) {
    //     results.push({ id: page.url, type: 'page', title: page.title, icon: page.icon, url: page.url });
    //   }
    // });

    return results;
  }, [debouncedSearchTerm, coursesData, instructorsData, categoriesData]);

  const runCommand = useCallback(
    (command: () => unknown) => {
      onOpenChange(false); // Đóng dialog
      command();
    },
    [onOpenChange]
  );

  // Phím tắt Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        // Thêm '/' làm phím tắt
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange, open]);

  const renderGroup = (
    type: SearchResultItem['type'],
    title: string,
    items: SearchResultItem[]
  ) => {
    const filteredItems = items.filter((item) => item.type === type);
    if (filteredItems.length === 0) return null;

    return (
      <CommandGroup heading={title}>
        {filteredItems.map((item) => (
          <CommandItem
            key={item.id}
            value={`${item.title} ${item.description || ''} ${item.type}`} // Value để cmdk filter nội bộ
            onSelect={() => runCommand(() => navigate(item.url))}
            className="cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
          >
            <div className="flex items-center w-full">
              {item.imageUrl ? (
                <Avatar className="h-6 w-6 mr-2.5 flex-shrink-0">
                  <AvatarImage src={item.imageUrl} />
                  <AvatarFallback>{item.title.substring(0, 1)}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-6 h-6 mr-2.5 flex items-center justify-center text-muted-foreground flex-shrink-0">
                  {item.icon || <Icons.search className="h-4 w-4" />}
                </div>
              )}
              <div className="flex-grow overflow-hidden">
                <p className="text-sm font-medium truncate">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search courses, instructors, categories..."
        value={inputValue} // Kiểm soát input value
        onValueChange={setInputValue} // Cập nhật khi người dùng gõ
        className="h-12 text-base"
      />
      <CommandList className="custom-scrollbar max-h-[calc(100vh-200px)] sm:max-h-[450px]">
        {' '}
        {/* Giới hạn chiều cao */}
        {isLoading && debouncedSearchTerm && (
          <div className="p-6 text-center">
            <Icons.spinner className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Searching...</p>
          </div>
        )}
        {!isLoading && !allResults.length && debouncedSearchTerm && (
          <CommandEmpty>
            <div className="py-6 text-center text-sm">
              <Icons.search className="h-10 w-10 text-muted-foreground/70 mx-auto mb-3" />
              <p className="font-medium">
                No results found for "{debouncedSearchTerm}".
              </p>
              <p className="text-muted-foreground">
                Try a different keyword or check your spelling.
              </p>
            </div>
          </CommandEmpty>
        )}
        {!isLoading && allResults.length > 0 && (
          <>
            {renderGroup('course', 'Courses', allResults)}
            {renderGroup('instructor', 'Instructors', allResults)}
            {renderGroup('category', 'Categories', allResults)}
            {/* {renderGroup('page', 'Pages', allResults)} */}
          </>
        )}
        {!debouncedSearchTerm && !isLoading && (
          <div className="py-10 text-center text-sm">
            <Icons.search className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Type something to start searching.
            </p>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
};
