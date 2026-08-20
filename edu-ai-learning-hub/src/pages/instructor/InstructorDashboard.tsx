// src/pages/instructor/InstructorDashboard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import InstructorLayout from '@/components/layout/InstructorLayout';
import { Button } from '@/components/ui/button';
import { useMyDashboardOverview } from '@/hooks/queries/instructor.queries';
import { useSettings } from '@/contexts/SettingsContext';
import PageHeader from '@/components/common/PageHeader';
import { StatCard } from './components/StatCard';
import { RecentActivity } from './components/RecentActivity';
import { TopCourses } from './components/TopCourses';
import { BarChart2, BookOpen, DollarSign, PlusCircle, Users, Wallet } from 'lucide-react';

const InstructorDashboard: React.FC = () => {
  const { data: dashboardData, isLoading } = useMyDashboardOverview();
  const { formatPrice } = useSettings();

  const stats = dashboardData?.stats;

  return (
    <InstructorLayout pageTitle="Bảng điều khiển">
      {/* Bản trước mở đầu bằng một tấm biểu ngữ tối màu tự đặt nền riêng, có quầng
          sáng và chữ chuyển sắc — nó tự tạo một chế độ tối cục bộ ngay giữa ứng
          dụng sáng. Nay dùng PageHeader chung; ba lối tắt trở thành nút hành động
          bên phải tiêu đề, ngắn gọn hơn mà vẫn ở đúng chỗ người dùng tìm. */}
      <PageHeader
        title="Chào mừng trở lại"
        description="Điểm tin học viên mới, theo dõi phong độ bài giảng và truy cập nhanh các công cụ giảng dạy."
        actions={
          <>
            <Button size="sm" asChild>
              <Link to="/instructor/courses/create">
                <PlusCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Tạo khóa học
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/instructor/analytics">
                <BarChart2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Phân tích
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/instructor/earnings">
                <Wallet className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Thu nhập
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng học viên"
          value={stats?.totalStudents?.toLocaleString('vi-VN') || 0}
          icon={<Users />}
          description="Trên tất cả khóa học"
          isLoading={isLoading}
        />
        <StatCard
          title="Khóa học đã mở"
          value={stats?.totalCourses || 0}
          icon={<BookOpen />}
          description="Khóa học đang hoạt động"
          isLoading={isLoading}
        />
        <StatCard
          title="Doanh thu tích lũy"
          value={formatPrice(stats?.totalLifetimeEarnings || 0)}
          icon={<DollarSign />}
          description="Tổng doanh số thu về"
          isLoading={isLoading}
        />
        <StatCard
          title="Số dư khả dụng"
          value={formatPrice(stats?.availableBalance || 0)}
          icon={<Wallet />}
          description="Có thể yêu cầu rút"
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity
          enrollments={dashboardData?.recentEnrollments || []}
          isLoading={isLoading}
        />
        <TopCourses
          courses={dashboardData?.topPerformingCourses || []}
          isLoading={isLoading}
        />
      </div>
    </InstructorLayout>
  );
};

export default InstructorDashboard;
