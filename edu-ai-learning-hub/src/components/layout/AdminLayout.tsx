import React from 'react';
import {
  Banknote,
  BarChart2,
  BookOpen,
  Boxes,
  Code,
  Coins,
  CreditCard,
  Layers,
  LayoutDashboard,
  Settings,
  Tag,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DashboardShell, { type NavSection } from './DashboardShell';

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

/**
 * Khu làm việc của quản trị viên.
 *
 * Toàn bộ phần khung đã chuyển sang DashboardShell dùng chung với khu giảng
 * viên; tệp này chỉ còn khai báo danh sách điều hướng. Menu được chia nhóm thay
 * vì đổ một mạch mười bốn mục như trước — mười bốn dòng phẳng thì không ai tìm
 * được gì.
 */
const AdminLayout = ({ children, pageTitle, breadcrumbs }: AdminLayoutProps) => {
  const { t } = useTranslation();

  const sections: NavSection[] = [
    {
      items: [
        {
          name: t('adminLayout.navigation.dashboard'),
          icon: LayoutDashboard,
          href: '/admin',
          exact: true,
        },
        { name: 'Báo cáo thống kê', icon: BarChart2, href: '/admin/reports' },
      ],
    },
    {
      title: 'Nội dung',
      items: [
        {
          name: t('adminLayout.navigation.courses'),
          icon: BookOpen,
          href: '/admin/courses',
        },
        {
          name: t('adminLayout.navigation.courseApprovals'),
          icon: BookOpen,
          href: '/admin/course-approvals',
        },
        {
          name: t('adminLayout.navigation.categories'),
          icon: Boxes,
          href: '/admin/categories',
        },
        {
          name: t('adminLayout.navigation.levels'),
          icon: Layers,
          href: '/admin/levels',
        },
        {
          name: t('adminLayout.navigation.skills'),
          icon: Code,
          href: '/admin/skills',
        },
        { name: 'Tri thức cho AI', icon: Code, href: '/admin/faqs' },
      ],
    },
    {
      title: 'Người dùng',
      items: [
        {
          name: t('adminLayout.navigation.users'),
          icon: Users,
          href: '/admin/users',
        },
      ],
    },
    {
      title: 'Tài chính',
      items: [
        { name: 'Chi trả giảng viên', icon: Banknote, href: '/admin/payouts' },
        {
          name: t('adminLayout.navigation.paymentMethods'),
          icon: CreditCard,
          href: '/admin/payment-methods',
        },
        {
          name: t('adminLayout.navigation.currencies'),
          icon: Coins,
          href: '/admin/currencies',
        },
        {
          name: t('adminLayout.navigation.exchangeRates'),
          icon: Banknote,
          href: '/admin/exchange-rates',
        },
        {
          name: t('adminLayout.navigation.promotions'),
          icon: Tag,
          href: '/admin/promotions',
        },
      ],
    },
    {
      title: 'Hệ thống',
      items: [
        { name: 'Cài đặt', icon: Settings, href: '/admin/settings' },
      ],
    },
  ];

  return (
    <DashboardShell
      areaLabel="Quản trị hệ thống"
      areaHref="/admin"
      sections={sections}
      pageTitle={pageTitle}
      breadcrumbs={breadcrumbs}
    >
      {children}
    </DashboardShell>
  );
};

export default AdminLayout;
