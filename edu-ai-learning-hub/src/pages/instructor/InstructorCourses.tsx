// src/pages/instructor/InstructorCourses.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { Button } from '@/components/ui/button';
import PaginationControls from '@/components/admin/PaginationControls';
import { useInstructorCourseFilters } from '@/hooks/useCourseFilters';
import { useMyInstructorCourses } from '@/hooks/queries/course.queries';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/common/PageHeader';
import SectionCard from '@/components/common/SectionCard';
import { Archive, Loader2, Plus } from 'lucide-react';
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
      <InstructorLayout pageTitle="Khóa học của tôi">
        <div className="flex h-96 flex-col items-center justify-center gap-3">
          <Loader2
            className="h-9 w-9 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            Đang tải danh sách khóa học…
          </p>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout pageTitle="Khóa học của tôi">
      <PageHeader
        title="Khóa học của bạn"
        description="Quản lý danh sách khóa học, chỉnh sửa nội dung bài giảng và tạo phụ đề tự động."
        actions={
          <>
            {/* [THÊM 18/08/2026 — COURSE IMPORT] Lối vào tính năng nhập từ ZIP.
                Đặt ở kiểu phụ (`outline`) vì "Tạo khóa học" mới là hành động
                chính; hai nút cùng nổi bật thì không nút nào nổi bật. */}
            <Button variant="outline" asChild>
              <Link to="/instructor/courses/import">
                <Archive className="mr-2 h-4 w-4" aria-hidden="true" />
                Nhập từ tệp ZIP
              </Link>
            </Button>

            <Button asChild>
              <Link to="/instructor/courses/create">
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Tạo khóa học mới
              </Link>
            </Button>
          </>
        }
      />

      <SectionCard>
        <CourseFilterBar
          filters={filters}
          updateFilter={updateFilter}
          clearFilters={clearFilters}
        />
      </SectionCard>

      <section>
        <CourseGrid
          courses={courses}
          isLoading={isLoading}
          isError={isError}
          error={error}
          currentInstructorId={instructorId}
        />
      </section>

      {!isLoading && totalPages > 1 && (
        <footer className="flex justify-center border-t border-border pt-6">
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
    </InstructorLayout>
  );
};

export default InstructorCourses;
