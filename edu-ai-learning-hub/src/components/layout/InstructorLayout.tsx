import React from 'react';
import {
  BarChart2,
  BookOpen,
  DollarSign,
  FileCheck,
  LayoutDashboard,
  PlusCircle,
  Upload,
  UserCircle,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DashboardShell, { type NavSection } from './DashboardShell';

interface InstructorLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

/**
 * Khu làm việc của giảng viên. Dùng chung khung với khu quản trị, chỉ khác
 * danh sách điều hướng.
 */
const InstructorLayout = ({
  children,
  pageTitle,
  breadcrumbs,
}: InstructorLayoutProps) => {
  const { t } = useTranslation();

  const sections: NavSection[] = [
    {
      items: [
        {
          name: t('instructorLayout.navigation.dashboard'),
          icon: LayoutDashboard,
          href: '/instructor/dashboard',
        },
        { name: 'Phân tích', icon: BarChart2, href: '/instructor/analytics' },
      ],
    },
    {
      title: 'Khóa học',
      items: [
        {
          name: t('instructorLayout.navigation.myCourses'),
          icon: BookOpen,
          href: '/instructor/courses',
          exact: true,
        },
        {
          name: t('instructorLayout.navigation.createCourse'),
          icon: PlusCircle,
          href: '/instructor/courses/create',
        },
        {
          name: 'Nhập từ tệp nén',
          icon: Upload,
          href: '/instructor/courses/import',
        },
        {
          name: t('instructorLayout.navigation.courseApprovals'),
          icon: FileCheck,
          href: '/instructor/course-approvals',
        },
      ],
    },
    {
      title: 'Học viên',
      items: [
        {
          name: t('instructorLayout.navigation.students'),
          icon: Users,
          href: '/instructor/students',
        },
      ],
    },
    {
      title: 'Tài khoản',
      items: [
        {
          name: t('instructorLayout.navigation.earnings'),
          icon: DollarSign,
          href: '/instructor/earnings',
        },
        {
          name: t('instructorLayout.navigation.myProfile'),
          icon: UserCircle,
          href: '/instructor/profile',
        },
      ],
    },
  ];

  return (
    <DashboardShell
      areaLabel="Khu giảng viên"
      areaHref="/instructor/dashboard"
      sections={sections}
      pageTitle={pageTitle}
      breadcrumbs={breadcrumbs}
    >
      {children}
    </DashboardShell>
  );
};

export default InstructorLayout;
