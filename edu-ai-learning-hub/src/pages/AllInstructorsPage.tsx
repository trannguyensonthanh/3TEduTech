// src/pages/AllInstructorsPage.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/components/ui/card';
import { Icons } from '@/components/common/Icons';
import { InstructorFilters } from '@/components/instructors/InstructorFilters';
import InstructorCard from '@/components/instructors/InstructorCard';
import { useInstructors } from '@/hooks/queries/instructor.queries';
import { useSkills } from '@/hooks/queries/skill.queries';
import { useDebounce } from '@/hooks/useDebounce'; // Đảm bảo đường dẫn đúng
import PaginationControls from '@/components/admin/PaginationControls'; // Đảm bảo đường dẫn đúng
import { InstructorSortByValue } from '@/types/common.types'; // Giả sử SortByValue cho instructor được định nghĩa
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { InstructorQueryParams } from '@/services/instructor.service';

const ITEMS_PER_PAGE_INSTRUCTORS = 9;

// Định nghĩa các tùy chọn sắp xếp cho giảng viên (Nên đặt trong types/common.types.ts)
export const INSTRUCTOR_SORT_OPTIONS: {
  value: InstructorSortByValue;
  label: string;
}[] = [
  { value: 'rating:desc', label: 'Điểm đánh giá cao nhất' },
  { value: 'studentCount:desc', label: 'Nhiều học viên nhất' },
  { value: 'courseCount:desc', label: 'Nhiều khóa học nhất' },
  { value: 'name:asc', label: 'Tên (A→Z)' },
  { value: 'name:desc', label: 'Tên (Z→A)' },
  // Thêm 'popularity' nếu backend hỗ trợ (có thể map sang một trường cụ thể)
  // { value: 'popularity', label: 'Most Popular' },
];

const AllInstructorsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParamsFromUrl = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const [searchTerm, setSearchTerm] = useState(
    queryParamsFromUrl.get('q') || ''
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [sortBy, setSortBy] = useState<InstructorSortByValue>(
    (queryParamsFromUrl.get('sort') as InstructorSortByValue) ||
      INSTRUCTOR_SORT_OPTIONS[0].value
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(queryParamsFromUrl.get('page') || '1', 10)
  );

  const [activeFilters, setActiveFilters] = useState<
    Omit<InstructorQueryParams, 'page' | 'limit' | 'sortBy' | 'searchTerm'>
  >(() => {
    const skillIdStr = queryParamsFromUrl.get('skillId');
    const ratingStr = queryParamsFromUrl.get('minRating'); // Đổi tên param cho khớp với hook
    return {
      skillId: skillIdStr ? parseInt(skillIdStr) : undefined,
      minRating: ratingStr ? parseFloat(ratingStr) : undefined,
    };
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { data: skillsData, isLoading: isLoadingSkills } = useSkills({
    limit: 100,
  }); // Lấy tất cả skills cho filter

  const queryParamsForAPI: InstructorQueryParams = useMemo(
    () => ({
      page: currentPage,
      limit: ITEMS_PER_PAGE_INSTRUCTORS,
      searchTerm: debouncedSearchTerm || undefined,
      sortBy: sortBy,
      skillId: activeFilters.skillId,
      minRating: activeFilters.minRating,
    }),
    [currentPage, debouncedSearchTerm, sortBy, activeFilters]
  );

  const {
    data: instructorsData,
    isLoading: isLoadingInstructorsInitial,
    isFetching: isFetchingInstructors,
    isError,
    error,
  } = useInstructors(queryParamsForAPI);

  const instructors = instructorsData?.instructors || [];
  const totalItems = instructorsData?.total || 0;
  const totalPages =
    instructorsData?.totalPages ||
    Math.ceil(totalItems / ITEMS_PER_PAGE_INSTRUCTORS) ||
    1;
  console.log('Instructors:', instructors);
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.set('q', debouncedSearchTerm);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (sortBy !== INSTRUCTOR_SORT_OPTIONS[0].value) params.set('sort', sortBy);
    if (activeFilters.skillId)
      params.set('skillId', activeFilters.skillId.toString());
    if (activeFilters.minRating)
      params.set('minRating', activeFilters.minRating.toString()); // Sửa tên param
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [
    debouncedSearchTerm,
    currentPage,
    sortBy,
    activeFilters,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, activeFilters, sortBy]);

  const handleFilterChange = useCallback(
    <K extends keyof typeof activeFilters>(
      key: K,
      value: (typeof activeFilters)[K] | null
    ) => {
      setActiveFilters((prev) => {
        const newState = { ...prev, [key]: value === null ? undefined : value }; // Dùng undefined để xóa
        if (value === null) delete newState[key as string];
        return newState;
      });
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    setActiveFilters({ skillId: undefined, minRating: undefined });
  }, []);

  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };
  const listContainerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07 },
    },
  };

  return (
    <Layout>
      <div className='border-b border-border bg-muted/30'>
        <motion.div
          variants={headerVariants}
          initial='hidden'
          animate='visible'
          className='container mx-auto px-4 pt-10 pb-8 md:pt-16 md:pb-12 text-center'
        >
          <Icons.usersRound className='h-16 w-16 md:h-20 md:w-20 mx-auto mb-4 text-primary' />
          <h1 className='mb-4 text-foreground'>Gặp gỡ đội ngũ giảng viên</h1>
          <p className='text-lg text-muted-foreground max-w-3xl mx-auto'>
            Học từ những người giỏi nhất. Giảng viên của chúng tôi là các chuyên
            gia đầu ngành, tận tâm chia sẻ kiến thức và đồng hành cùng bạn.
          </p>
        </motion.div>
      </div>

      <div className='container mx-auto px-4 py-8 md:py-10'>
        <div className='flex flex-col lg:flex-row gap-x-8 gap-y-6'>
          {/* Filters Sidebar */}
          <div className='lg:w-1/4 xl:w-1/5 lg:sticky lg:top-24 self-start max-h-[calc(100vh-120px)] lg:overflow-y-auto custom-scrollbar'>
            <div className='lg:hidden mb-6'>
              <Sheet
                open={showMobileFilters}
                onOpenChange={setShowMobileFilters}
              >
                <SheetTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full h-12 text-base flex items-center justify-center gap-2'
                  >
                    <Icons.filter className='h-5 w-5' /> Bộ lọc và sắp xếp
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side='left'
                  className='w-[300px] sm:w-[340px] p-0 flex flex-col'
                >
                  <SheetHeader className='p-5 pb-3 border-b border-border'>
                    <SheetTitle className='text-xl'>
                      Lọc giảng viên
                    </SheetTitle>
                  </SheetHeader>
                  <ScrollArea className='flex-grow'>
                    <div className='p-5'>
                      <InstructorFilters
                        filters={activeFilters}
                        onFilterChange={handleFilterChange}
                        onResetFilters={handleResetFilters}
                        skills={skillsData?.skills || []}
                        isLoadingSkills={isLoadingSkills}
                      />
                    </div>
                  </ScrollArea>
                  <div className='p-4 border-t border-border'>
                    <SheetClose asChild>
                      <Button
                        className='w-full h-11 text-base'
                        onClick={() => setShowMobileFilters(false)}
                      >
                        Áp dụng bộ lọc
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className='hidden lg:block'>
              <InstructorFilters
                filters={activeFilters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                skills={skillsData?.skills || []}
                isLoadingSkills={isLoadingSkills}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className='w-full lg:flex-1 min-w-0'>
            <div className='flex flex-col md:flex-row gap-4 mb-6 md:mb-8 items-center'>
              <div className='relative flex-grow w-full'>
                <Icons.search className='absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none' />
                <Input
                  type='search'
                  placeholder='Tìm giảng viên theo tên hoặc lĩnh vực…'
                  className='pl-11 h-12 text-base rounded-lg border-border bg-card focus-visible:ring-primary'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {(isLoadingInstructorsInitial || isFetchingInstructors) &&
                  debouncedSearchTerm && (
                    <Loader2 className='absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground' />
                  )}
              </div>
              <Select
                value={sortBy}
                onValueChange={(value) =>
                  setSortBy(value as InstructorSortByValue)
                }
              >
                <SelectTrigger className='w-full md:w-[260px] h-12 text-base rounded-lg border-border bg-card focus:ring-primary'>
                  <SelectValue placeholder='Sắp xếp theo…' />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel className='px-3 py-1.5'>
                      Sắp xếp giảng viên theo
                    </SelectLabel>
                    {INSTRUCTOR_SORT_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className='text-base h-10'
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {(isLoadingInstructorsInitial || isFetchingInstructors) &&
              !instructorsData?.instructors && (
                <div className='text-sm text-muted-foreground mb-4 flex items-center'>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Đang tải
                  danh sách giảng viên…
                </div>
              )}
            {!isLoadingInstructorsInitial &&
              !isFetchingInstructors &&
              !isError && (
                <div className='mb-5 text-sm text-muted-foreground'>
                  Đang hiển thị{' '}
                  <span className='font-semibold text-foreground'>
                    {instructors.length}
                  </span>{' '}
                  trong tổng số{' '}
                  <span className='font-semibold text-foreground'>
                    {totalItems}
                  </span>{' '}
                  giảng viên.

                  {isFetchingInstructors && (
                    <Loader2 className='inline ml-2 h-4 w-4 animate-spin' />
                  )}
                </div>
              )}

            {isLoadingInstructorsInitial &&
            (!instructorsData || !instructors) ? (
              <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8'>
                {[...Array(ITEMS_PER_PAGE_INSTRUCTORS)].map((_, index) => (
                  <Card
                    key={`instructor-skeleton-${index}`}
                    className='overflow-hidden rounded-xl border border-border bg-card shadow-none'
                  >
                    <CardContent className='p-6 flex flex-col items-center text-center'>
                      <Skeleton className='h-24 w-24 md:h-28 md:w-28 rounded-full mb-4' />
                      <Skeleton className='h-6 w-3/4 mb-1.5' />
                      <Skeleton className='h-4 w-1/2 mb-3' />
                      <Skeleton className='h-3 w-full mb-1' />
                      <Skeleton className='h-3 w-4/5' />
                      <div className='flex justify-center space-x-4 mt-4 pt-3 border-t w-full'>
                        <Skeleton className='h-4 w-10' />{' '}
                        <Skeleton className='h-4 w-10' />{' '}
                        <Skeleton className='h-4 w-10' />
                      </div>
                    </CardContent>
                    <CardFooter className='p-4 border-t border-border'>
                      <Skeleton className='h-11 w-full' />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : isError ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='text-center py-16 rounded-xl border border-border bg-danger-soft p-8'
              >
                <Icons.alertTriangle className='mx-auto h-16 w-16 mb-6 text-danger' />
                <h3 className='text-2xl font-semibold mb-3 text-danger'>
                  Không tải được danh sách giảng viên
                </h3>
                <p className='text-muted-foreground mb-6'>
                  {error?.message || 'Đã xảy ra lỗi ngoài dự kiến.'}
                </p>
                <Button
                  variant='destructive'
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </Button>
              </motion.div>
            ) : instructors.length > 0 ? (
              <motion.div
                variants={listContainerVariants}
                initial='hidden'
                animate='visible'
                className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8'
              >
                {instructors.map((instructor) => (
                  <InstructorCard
                    key={instructor.accountId}
                    instructor={instructor}
                  />
                ))}
              </motion.div>
            ) : (
              !isFetchingInstructors && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='text-center py-20 col-span-full rounded-xl border border-dashed border-border bg-muted/30 p-8'
                >
                  <Icons.usersRound className='mx-auto h-20 w-20 text-muted-foreground opacity-60 mb-6' />
                  <h3 className='text-2xl font-semibold text-foreground mb-3'>
                    Không tìm thấy giảng viên nào
                  </h3>
                  <p className='mt-2 text-muted-foreground max-w-md mx-auto'>
                    Chưa có giảng viên nào khớp với tiêu chí hiện tại. Bạn thử
                    đổi từ khóa tìm kiếm hoặc bộ lọc xem sao.
                  </p>
                  {(debouncedSearchTerm ||
                    Object.values(activeFilters).some(
                      (v) => v !== null && v !== undefined
                    )) && (
                    <Button
                      variant='outline'
                      className='mt-6'
                      onClick={() => {
                        setSearchTerm('');
                        handleResetFilters();
                      }}
                    >
                      <Icons.listRestart className='mr-2 h-4 w-4' /> Xóa toàn bộ
                      bộ lọc và từ khóa
                    </Button>
                  )}
                </motion.div>
              )
            )}

            {!isError && totalItems > 0 && totalPages > 1 && (
              <div className='flex justify-center mt-10 md:mt-12'>
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={(page) => setCurrentPage(page)} // Đảm bảo prop onPageChange đúng
                  isDisabled={isFetchingInstructors} // Đổi tên prop nếu PaginationControls dùng khác
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AllInstructorsPage;
