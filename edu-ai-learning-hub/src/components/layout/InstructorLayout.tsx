// src/components/layout/InstructorLayout.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart2,
  DollarSign,
  Settings,
  FileText,
  User,
  FileCheck,
  Menu,
  X,
  MessageSquare,
  ArrowLeftRight,
  Home,
  LogOut,
  ChevronRight,
  UserCircle,
  BookUser,
  PlusCircle, // Icons.plusCircle
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/common/Icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator'; // Import Separator
import { useAuth } from '@/contexts/AuthContext';
import { useLogoutMutation } from '@/hooks/queries/auth.queries';
import { useTranslation } from 'react-i18next';

interface InstructorLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

const InstructorLayout = ({
  children,
  pageTitle,
  breadcrumbs,
}: InstructorLayoutProps) => {
  const { t } = useTranslation();
  const navigationItems = [
    {
      name: t('instructorLayout.navigation.dashboard'),
      icon: LayoutDashboard,
      href: '/instructor',
      notifications: 0,
    },
    {
      name: t('instructorLayout.navigation.earnings'),
      icon: DollarSign,
      href: '/instructor/earnings',
      notifications: 0,
    },
    {
      name: t('instructorLayout.navigation.myCourses'),
      icon: BookOpen,
      href: '/instructor/courses',
      notifications: 0,
    },
    {
      name: t('instructorLayout.navigation.createCourse'),
      icon: PlusCircle,
      href: '/instructor/courses/create',
      notifications: 0,
    },
    {
      name: t('instructorLayout.navigation.courseApprovals'),
      icon: FileCheck,
      href: '/instructor/course-approvals',
      notifications: 0,
    },
    {
      name: t('instructorLayout.navigation.students'),
      icon: Users,
      href: '/instructor/students',
      notifications: 0,
    },
    {
      name: 'Analytics',
      icon: BarChart2,
      href: '/instructor/analytics',
      notifications: 0,
    },
  ];

  const accountNavigationItems = [
    {
      name: t('instructorLayout.navigation.myProfile'),
      icon: UserCircle,
      href: '/instructor/profile',
      notifications: 0,
    },
  ];

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false); // Cho desktop collapse (tùy chọn)
  const location = useLocation();
  const { userData: user } = useAuth();
  const logoutMutation = useLogoutMutation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutMutation.mutate();
    // navigate('/'); // Đã xử lý trong hook
  };

  const getInitials = (name?: string | null): string => {
    if (!name) return 'U';
    const words = name.split(' ').filter(Boolean);
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (
      words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')
    ).toUpperCase();
  };

  useEffect(() => {
    if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const renderNavLinks = (
    items: typeof navigationItems,
    sectionTitle?: string
  ) => (
    <>
      {sectionTitle && (
        <p className='px-4 pt-3 pb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider'>
          {t('instructorLayout.myAccount')}
        </p>
      )}
      {items.map((item) => {
        const isActive =
          location.pathname === item.href ||
          (item.href !== '/instructor' &&
            location.pathname.startsWith(item.href) &&
            item.href.length > '/instructor'.length); // Cải thiện logic active
        return (
          <TooltipProvider key={item.name} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={item.href}
                  onClick={() =>
                    isMobileSidebarOpen && setIsMobileSidebarOpen(false)
                  } 
                  className={cn(
                    buttonVariants({
                      variant: isActive ? 'secondary' : 'ghost',
                      size: 'default',
                    }),
                    'w-full justify-start h-10 text-sm font-medium', // Giảm h một chút
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/25 dark:text-sky-300 font-semibold shadow-sm' // ĐIỀU CHỈNH Ở ĐÂY
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-slate-700/80'
                    // isSidebarCollapsed && "justify-center px-0" // Bỏ comment nếu dùng tính năng collapse
                  )}
                >
                  <item.icon className='h-[18px] w-[18px] mr-3 opacity-90' />
                  <span>{item.name}</span>
                  {item.notifications > 0 && (
                    <Badge className='ml-auto bg-destructive text-destructive-foreground hover:bg-destructive/80 px-1.5 text-[10px] h-5 leading-none'>
                      {item.notifications}
                    </Badge>
                  )}
                </Link>
              </TooltipTrigger>
              {/* Tooltip chỉ hiển thị khi sidebar collapsed (nếu có tính năng đó) */}
              {/* {isDesktopSidebarCollapsed && <TooltipContent side="right">{item.name}</TooltipContent>} */}
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </>
  );

  return (
    <div className='flex min-h-screen bg-slate-100 dark:bg-slate-900'>
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className='fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden'
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col w-64 border-r bg-background dark:bg-slate-800 dark:border-slate-700 transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-lg',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='flex h-20 items-center border-b px-4 dark:border-slate-700 shrink-0'>
          <Link
            to='/instructor'
            className='flex items-center space-x-2.5 group'
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <Icons.logo className='h-8 w-8 text-primary transition-transform duration-300 group-hover:rotate-[10deg]' />
            <span className='font-bold text-xl text-foreground group-hover:text-primary transition-colors'>
              {t('instructorLayout.title')} 
            </span>
          </Link>
          <Button
            variant='ghost'
            size='icon'
            className='lg:hidden ml-auto text-muted-foreground hover:text-foreground'
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label='Close sidebar'
          >
            <X className='h-5 w-5' />
          </Button>
        </div>

        <ScrollArea className='flex-1 custom-scrollbar'>
          <nav className='p-3 space-y-1.5'>
            {renderNavLinks(navigationItems)}
            <Separator className='my-3 dark:bg-slate-700' />
            {renderNavLinks(
              accountNavigationItems,
              t('instructorLayout.myAccount')
            )}
          </nav>
        </ScrollArea>

        <div className='p-4 border-t mt-auto dark:border-slate-700 bg-background dark:bg-slate-800'>
          <Button
            variant='outline'
            asChild
            className='w-full justify-start h-10 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent'
          >
            <Link to='/'>
              <Home className='h-4 w-4 mr-2.5 opacity-80' />
              {t('instructorLayout.goToMainSite')}
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className='lg:ml-64 flex-1 flex flex-col min-h-screen'>
        {' '}
        {/* ml-64 bằng chiều rộng sidebar */}
        {/* Top Header của Main Content */}
        <header className='sticky top-0 z-20 h-20 border-b bg-background/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 dark:border-slate-700'>
          <div className='flex items-center'>
            <Button
              variant='ghost'
              size='icon'
              className='lg:hidden mr-2 text-muted-foreground hover:text-foreground'
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label='Open sidebar'
            >
              <Menu className='h-6 w-6' />
            </Button>
            {/* Breadcrumbs hoặc Tiêu đề trang động */}
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav className='hidden md:flex items-center text-sm'>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {crumb.href ? (
                      <Link
                        to={crumb.href}
                        className='text-muted-foreground hover:text-primary transition-colors'
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className='font-medium text-foreground'>
                        {crumb.label}
                      </span>
                    )}
                    {index < breadcrumbs.length - 1 && (
                      <ChevronRight className='h-4 w-4 mx-1.5 text-muted-foreground' />
                    )}
                  </React.Fragment>
                ))}
              </nav>
            ) : pageTitle ? (
              <h1 className='text-xl font-semibold text-foreground hidden md:block'>
                {pageTitle}
              </h1>
            ) : (
              <h1 className='text-xl font-semibold text-foreground hidden md:block'>
                {t('instructorLayout.dashboardTitle')}
              </h1>
            )}
          </div>

          <div className='flex items-center space-x-3'>
            {/* User Avatar và Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='relative h-10 w-10 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background group'
                  >
                    <Avatar className='h-9 w-9 border-2 border-transparent group-hover:border-primary/60'>
                      <AvatarImage
                        src={
                          user.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.fullName || 'U'
                          )}&background=random&size=96`
                        }
                        alt={user.fullName || 'User'}
                      />
                      <AvatarFallback className='bg-muted text-muted-foreground font-semibold'>
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56' align='end'>
                  <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col space-y-0.5'>
                      <p className='text-sm font-medium leading-none'>
                        {user.fullName}
                      </p>
                      <p className='text-xs leading-none text-muted-foreground'>
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to='/profile' className='flex items-center w-full'>
                      <UserCircle className='mr-2 h-4 w-4' />
                      Main Profile
                    </Link>
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem asChild>
                    <Link
                      to="/instructor/settings"
                      className="flex items-center w-full"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Instructor Settings
                    </Link>
                  </DropdownMenuItem> */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className='text-red-600 focus:text-red-600 dark:focus:bg-red-800/30'
                  >
                    <LogOut className='mr-2 h-4 w-4' /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>
        {/* Page Content */}
        <div className='flex-1 overflow-y-auto custom-scrollbar'>
          {' '}
          {/* Scroll cho nội dung chính */}
          <main className='p-4 py-6 md:p-6 lg:p-8'>{children}</main>
          <footer className='p-6 border-t text-center text-xs text-muted-foreground dark:border-slate-700'>
            {t('instructorLayout.copyright', {
              year: new Date().getFullYear(),
            })}
          </footer>
        </div>
      </div>
    </div>
  );
};

export default InstructorLayout;
