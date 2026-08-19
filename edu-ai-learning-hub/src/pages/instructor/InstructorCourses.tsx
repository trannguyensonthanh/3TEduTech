// src/pages/instructor/InstructorCourses.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { Button } from '@/components/ui/button';
import PaginationControls from '@/components/admin/PaginationControls';
import { useInstructorCourseFilters } from '@/hooks/useCourseFilters';
import { useMyInstructorCourses } from '@/hooks/queries/course.queries';
import { useAuth } from '@/contexts/AuthContext';
import { Icons } from '@/components/common/Icons';
import CourseFilterBar from './components/CourseFilterBar';
import CourseGrid from './components/CourseGrid';

const InstructorCourses: React.FC = () => {
  const { userData } = useAuth();
  const instructorId = userData ? parseInt(userData.id) : 0;

  const {
    currentPage,
    filters,
    queryParams,
    setPage,
    updateFilter,
    clearFilters,
  } = useInstructorCourseFilters(instructorId);

  const { data, isLoading, isError, error } = useMyInstructorCourses(
    queryParams,
    { enabled: !!instructorId }
  );

  const courses = data?.courses;
  const totalPages = data?.totalPages || 1;

  if (!instructorId) {
    return (
      <InstructorLayout>
        <div className='flex flex-col items-center justify-center h-96 gap-3'>
          <Icons.loader2 className='h-9 w-9 animate-spin text-indigo-500' />
          <p className='text-sm font-semibold text-muted-foreground animate-pulse'>Đang kết nối đến Phòng Quản Trị Khóa Học...</p>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className='space-y-8 p-4 md:p-6 lg:p-8 max-w-8xl mx-auto'>
        {/* VIBRANT STUDIO COMMAND BANNER */}
        <header className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-indigo-500/30 shadow-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between sm:items-center gap-6'>
          <div className='absolute -right-12 -bottom-12 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none animate-pulse' />
          <div className='absolute left-10 -top-12 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none' />

          <div className='relative z-10 space-y-2.5'>
            <div className='inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-300 backdrop-blur-md shadow-inner'>
              <Icons.bookOpen className='w-3.5 h-3.5 text-pink-400 animate-pulse' />
              <span className='tracking-wider uppercase'>COURSE MANAGEMENT HUB</span>
            </div>
            <h1 className='text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-outfit'>
              Khóa Học <span className='bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-300 font-black'>Của Bạn</span>
            </h1>
            <p className='text-slate-300 text-sm md:text-base font-normal max-w-xl opacity-95 leading-relaxed'>
              Quản lý toàn bộ danh sách khóa học, điều chỉnh nội dung bài giảng, và áp dụng siêu công nghệ AI Subtitles thần tốc!
            </p>
          </div>

          <div className='relative z-10 sm:self-center shrink-0 flex flex-col sm:flex-row gap-3'>
            {/* [THÊM 18/08/2026 — COURSE IMPORT] Lối vào tính năng nhập từ ZIP.
                Dùng kiểu kính mờ chứ không phải gradient đặc: hai nút cùng rực
                rỡ thì không còn nút nào nổi bật, mà "Tạo Khóa Học Mới" mới là
                hành động chính. */}
            <Link to='/instructor/courses/import'>
              <Button size='lg' variant='outline' className='w-full sm:w-auto h-12 rounded-2xl border-white/25 bg-white/10 px-6 text-sm font-bold tracking-wide text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:text-white'>
                <Icons.archive className='mr-2 h-5 w-5' />
                Nhập Từ Tệp ZIP
              </Button>
            </Link>

            <Link to='/instructor/courses/create'>
              <Button size='lg' className='w-full sm:w-auto h-12 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-extrabold px-6 shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:-translate-y-0.5 transition-all duration-300 border border-white/20 text-sm tracking-wide'>
                <Icons.plus className='mr-2 h-5 w-5 stroke-[3]' />
                Tạo Khóa Học Mới
              </Button>
            </Link>
          </div>
        </header>

        {/* GLASSMORPHISM FILTER BAR SECTION */}
        <section className='rounded-2xl border border-white/10 dark:border-slate-800/80 bg-card/80 backdrop-blur-xl p-5 shadow-xl transition-all duration-300'>
          <CourseFilterBar
            filters={filters}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
          />
        </section>

        {/* COURSES GRID SECTION */}
        <section className='pt-2'>
          <CourseGrid
            courses={courses}
            isLoading={isLoading}
            isError={isError}
            error={error}
            currentInstructorId={instructorId}
          />
        </section>

        {/* PAGINATION SECTION */}
        {!isLoading && totalPages > 1 && (
          <footer className='pt-6 border-t border-border/40 flex justify-center'>
            {/* [SỬA 19/08/2026] `onPageChange` -> `setCurrentPage`.
                Đây là LỖI TÔI GÂY RA khi viết lại tệp này để thêm nút nhập ZIP:
                bản gốc dùng đúng tên `setCurrentPage`, tôi đổi nhầm sang một cái
                tên không hề tồn tại trong PaginationControlsProps.

                Hậu quả không phải chỉ ở tầng kiểu: prop bắt buộc `setCurrentPage`
                thành `undefined`, nên bấm số trang KHÔNG có tác dụng gì cả —
                phân trang danh sách khóa học của giảng viên đứng im.

                Không ai phát hiện vì `npm run build` chỉ chạy Vite (esbuild xóa
                kiểu chứ không kiểm tra kiểu), còn `tsc -p tsconfig.json` thì
                không kiểm tra tệp nào vì tsconfig gốc có "files": []. */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setPage}
            />
          </footer>
        )}
      </div>
    </InstructorLayout>
  );
};

export default InstructorCourses;
