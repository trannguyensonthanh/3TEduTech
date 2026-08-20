import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  LogOut,
  Menu,
  UserCircle,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useLogoutMutation } from '@/hooks/queries/auth.queries';
import { cn } from '@/lib/utils';

export interface NavItem {
  name: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  /** Chỉ sáng khi đường dẫn khớp tuyệt đối. Dùng cho mục trang chủ của khu vực. */
  exact?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

interface DashboardShellProps {
  /** Tên khu làm việc hiện ở đầu thanh bên, ví dụ "Quản trị hệ thống". */
  areaLabel: string;
  areaHref: string;
  sections: NavSection[];
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Khung dùng chung cho hai khu làm việc: quản trị viên và giảng viên.
 *
 * Vì sao gom lại: trước đây hai khu có hai tệp bố cục hoàn toàn khác nhau — một
 * bên dùng khung chia cột kéo được, một bên dùng thanh bên cố định; hai bên khác
 * cả chiều rộng thanh bên, cách đánh dấu mục đang chọn, lẫn việc có hay không có
 * thanh tiêu đề. Người dùng chuyển giữa hai khu là thấy như hai sản phẩm khác
 * nhau. Nay chỉ còn một khung, mỗi khu chỉ khai báo danh sách điều hướng của mình.
 */
export const DashboardShell = ({
  areaLabel,
  areaHref,
  sections,
  pageTitle,
  breadcrumbs,
  headerActions,
  children,
}: DashboardShellProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userData: user } = useAuth();
  const logoutMutation = useLogoutMutation();

  // Đóng thanh bên sau mỗi lần điều hướng trên màn hình hẹp.
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const isActive = (item: NavItem) =>
    item.exact
      ? location.pathname === item.href
      : location.pathname === item.href ||
        location.pathname.startsWith(`${item.href}/`);

  const getInitials = (name?: string | null): string => {
    if (!name) return 'U';
    const words = name.split(' ').filter(Boolean);
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
        <Link
          to={areaHref}
          className="truncate text-sm font-semibold text-foreground"
        >
          {areaLabel}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Đóng menu"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <nav className="space-y-6 px-3 py-4">
          {sections.map((section, sectionIndex) => (
            <div key={section.title ?? `section-${sectionIndex}`}>
              {section.title ? (
                <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
              ) : null}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          active
                            ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            active
                              ? 'text-sidebar-primary'
                              : 'text-muted-foreground group-hover:text-foreground'
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.name}</span>
                        {item.badge && item.badge > 0 ? (
                          <Badge
                            variant="secondary"
                            className="ml-auto h-5 min-w-5 justify-center px-1.5 text-xs tabular-nums"
                          >
                            {item.badge > 99 ? '99+' : item.badge}
                          </Badge>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Home className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>Về trang chủ</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Thanh bên cố định trên màn hình rộng */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {/* Thanh bên dạng trượt trên màn hình hẹp */}
      {isMobileOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border lg:hidden">
            {sidebar}
          </aside>
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 lg:hidden"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Mở menu"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav
                aria-label="Đường dẫn"
                className="flex items-center gap-1 text-sm text-muted-foreground"
              >
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={`${crumb.label}-${index}`}>
                    {index > 0 ? (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    ) : null}
                    {crumb.href && index < breadcrumbs.length - 1 ? (
                      <Link
                        to={crumb.href}
                        className="truncate transition-colors hover:text-foreground"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="truncate font-medium text-foreground">
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            ) : pageTitle ? (
              <span className="truncate text-sm font-medium text-foreground">
                {pageTitle}
              </span>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {headerActions}
            <LanguageToggle />
            <Separator orientation="vertical" className="mx-1 h-6" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 gap-2 px-2"
                  aria-label="Tài khoản"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback className="text-xs">
                      {getInitials(user?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-32 truncate text-sm sm:inline">
                    {user?.fullName ?? 'Tài khoản'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-medium">
                    {user?.fullName ?? 'Tài khoản'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Hồ sơ cá nhân
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-danger focus:text-danger"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1">
          <div className="page-container page-stack">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardShell;
