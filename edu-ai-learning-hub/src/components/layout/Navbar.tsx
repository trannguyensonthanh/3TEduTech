// src/components/layout/Navbar.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '../common/Icons';
import AuthModal from '../auth/AuthModal';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import CartDropdown from './CartDropdown';
import { SearchCommandDialog } from '../search/SearchCommandDialog'; // Dialog tìm kiếm
import { useAuth } from '@/contexts/AuthContext';
import { useLogoutMutation } from '@/hooks/queries/auth.queries';
import { useMyCart } from '@/hooks/queries/cart.queries';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  Moon,
  Sun,
  LogOut,
  LayoutDashboard,
  BookUser,
  UserCircle,
  GraduationCap,
  CreditCard,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { useTranslation } from 'react-i18next';

// Dữ liệu liên kết điều hướng. `label` cũng chính là khóa dịch trong navbar.links.
const navLinks = [
  {
    href: '/courses',
    label: 'Courses',
    icon: <Icons.course className='mr-3 h-5 w-5' />,
  },
  {
    href: '/categories',
    label: 'Categories',
    icon: <Icons.folder className='mr-3 h-5 w-5' />,
  },
  {
    href: '/instructors',
    label: 'Instructors',
    icon: <Icons.instructors className='mr-3 h-5 w-5' />,
  },
  {
    href: '/about',
    label: 'About Us',
    icon: <Icons.info className='mr-3 h-5 w-5' />,
  },
];

/**
 * Thanh điều hướng chung.
 *
 * Bản trước dùng nền kính mờ khi cuộn, một nút "AI Master" chuyển sắc ba màu có
 * hiệu ứng nhấp nháy, và vài mục menu tự tô màu riêng. Nay thanh luôn dùng nền
 * trang, chỉ hiện đường kẻ khi cuộn, và mục nhấn mạnh dùng đúng một sắc độ của
 * màu nhấn.
 */
const Navbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [defaultAuthTab, setDefaultAuthTab] = useState<'login' | 'signup'>(
    'login'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSearchDialog, setOpenSearchDialog] = useState(false);

  /* Giữ lời gọi này để giỏ hàng được nạp sẵn khi thanh điều hướng hiện ra;
     số lượng sản phẩm do CartDropdown tự hiển thị. */
  useMyCart();

  const { theme, setTheme } = useTheme();

  const logoutMutation = useLogoutMutation({
    onSuccess: () => {
      setMobileMenuOpen(false);
      window.location.href = '/';
    },
  });
  const {
    userData: user,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false); // Đóng mobile menu khi route thay đổi
  }, [location.pathname]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const handleLogout = () => logoutMutation.mutate();

  const getInitials = (name?: string | null): string => {
    if (!name) return 'U';
    const words = name.split(' ').filter(Boolean);
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const userRoleDisplay = (roleId?: string): string => {
    if (!roleId) return 'Thành viên';
    switch (roleId) {
      case 'AD':
        return 'Quản trị viên';
      case 'SA':
        return 'Quản trị cấp cao';
      case 'GV':
        return 'Giảng viên';
      case 'NU':
      default:
        return 'Học viên';
    }
  };

  const mobileAccountLinks = [
    {
      href: '/my-courses',
      label: t('navbar.myLearning'),
      icon: <GraduationCap className='h-5 w-5' />,
    },
    {
      href: '/profile',
      label: t('navbar.profileSettings'),
      icon: <UserCircle className='h-5 w-5' />,
    },
    {
      href: '/orders',
      label: t('navbar.orderHistory'),
      icon: <CreditCard className='h-5 w-5' />,
    },
    {
      href: '/certificates',
      label: t('navbar.myCertificates'),
      icon: <Icons.certificate className='h-5 w-5' />,
    },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full bg-background transition-colors duration-200',
        isScrolled ? 'border-b border-border' : 'border-b border-transparent'
      )}
    >
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div
          className={cn(
            'flex items-center justify-between transition-[height] duration-300 ease-out',
            isScrolled ? 'h-16' : 'h-20'
          )}
        >
          {/* Logo và điều hướng chính (máy tính) */}
          <div className='flex items-center'>
            <Link
              to='/'
              className='mr-4 flex shrink-0 items-center gap-2.5 lg:mr-6'
            >
              <Icons.logo className='h-8 w-8 text-primary' />
              <span className='text-xl font-semibold tracking-tight text-foreground'>
                3TEduTech
              </span>
            </Link>
            <nav className='hidden items-center gap-0.5 lg:flex xl:gap-1'>
              {navLinks.map((link) => {
                const isActive =
                  location.pathname === link.href ||
                  (link.href !== '/' && location.pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {t(`navbar.links.${link.label}`)}
                  </Link>
                );
              })}
              <Link
                to='/ai-master'
                className='ml-1 flex h-9 items-center gap-1.5 rounded-md bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15'
              >
                <Sparkles className='h-4 w-4' aria-hidden='true' />
                AI Master
              </Link>
            </nav>
          </div>

          {/* Bên phải: tìm kiếm, giao diện, tài khoản (máy tính) */}
          <div className='hidden items-center gap-2 lg:flex'>
            <LanguageToggle />
            <Button
              variant='outline'
              onClick={() => setOpenSearchDialog(true)}
              className='h-10 w-auto justify-start px-3 text-sm text-muted-foreground'
              aria-label='Tìm kiếm khóa học'
            >
              <Icons.search className='mr-2 h-4 w-4' aria-hidden='true' />
              {t('navbar.search')}
              <kbd className='pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted pl-2 pr-1.5 font-mono text-[10px] font-medium text-muted-foreground'>
                <span className='text-xs'>⌘</span>K
              </kbd>
            </Button>

            <Button
              variant='ghost'
              size='icon'
              onClick={toggleTheme}
              className='rounded-full text-muted-foreground hover:text-foreground'
              aria-label='Đổi giao diện sáng / tối'
            >
              <Sun className='h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
              <Moon className='absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
            </Button>

            {isAuthenticated && (
              <>
                <NotificationDropdown />
                <CartDropdown />
              </>
            )}

            {isAuthLoading ? (
              <Skeleton className='h-10 w-10 rounded-full' />
            ) : isAuthenticated && user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='relative h-10 w-10 rounded-full p-0'
                    aria-label='Menu tài khoản'
                  >
                    <Avatar className='h-9 w-9 border border-border'>
                      <AvatarImage
                        src={
                          user.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.fullName || 'User'
                          )}&background=random&size=96&font-size=0.4&bold=true&format=svg`
                        }
                        alt={user.fullName || 'Người dùng'}
                      />
                      <AvatarFallback className='bg-muted font-semibold text-muted-foreground'>
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-60 p-2' align='end' forceMount>
                  <div className='mb-1 flex items-center p-2'>
                    <Avatar className='mr-3 h-11 w-11 border border-border'>
                      <AvatarImage
                        src={
                          user.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.fullName || 'User'
                          )}&background=random&size=128&font-size=0.4&bold=true&format=svg`
                        }
                        alt={user.fullName || 'Người dùng'}
                      />
                      <AvatarFallback className='bg-muted text-muted-foreground'>
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col space-y-0.5 overflow-hidden'>
                      <p
                        className='truncate text-sm font-semibold leading-none text-foreground'
                        title={user.fullName || 'Người dùng'}
                      >
                        {user.fullName || 'Người dùng'}
                      </p>
                      <p
                        className='truncate text-xs leading-tight text-muted-foreground'
                        title={user.email}
                      >
                        {user.email}
                      </p>
                      <p
                        className='mt-0.5 text-[11px] font-medium leading-tight text-muted-foreground'
                        title={userRoleDisplay(user.role)}
                      >
                        {userRoleDisplay(user.role)}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {(user.role === 'AD' ||
                    user.role === 'SA' ||
                    user.role === 'GV') && (
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>
                        {t('navbar.dashboards')}
                      </DropdownMenuLabel>
                      {(user.role === 'AD' || user.role === 'SA') && (
                        <DropdownMenuItem asChild className='h-9 cursor-pointer'>
                          <Link to='/admin' className='flex w-full items-center'>
                            <LayoutDashboard
                              className='mr-2.5 h-4 w-4'
                              aria-hidden='true'
                            />
                            {t('navbar.adminPanel')}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {(user.role === 'GV' ||
                        user.role === 'AD' ||
                        user.role === 'SA') && (
                        <DropdownMenuItem asChild className='h-9 cursor-pointer'>
                          <Link
                            to='/instructor/earnings'
                            className='flex w-full items-center'
                          >
                            <BookUser
                              className='mr-2.5 h-4 w-4'
                              aria-hidden='true'
                            />
                            {t('navbar.instructorHub')}
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuGroup>
                  )}
                  {(user.role === 'AD' ||
                    user.role === 'SA' ||
                    user.role === 'GV') && <DropdownMenuSeparator />}
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{t('navbar.mySpace')}</DropdownMenuLabel>
                    <DropdownMenuItem asChild className='h-9 cursor-pointer'>
                      <Link
                        to='/my-courses'
                        className='flex w-full items-center'
                      >
                        <GraduationCap
                          className='mr-2.5 h-4 w-4'
                          aria-hidden='true'
                        />
                        {t('navbar.myLearning')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className='h-9 cursor-pointer'>
                      <Link
                        to='/learning-report'
                        className='flex w-full items-center'
                      >
                        <BarChart3
                          className='mr-2.5 h-4 w-4'
                          aria-hidden='true'
                        />
                        Báo cáo học tập AI
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className='h-9 cursor-pointer'>
                      <Link to='/profile' className='flex w-full items-center'>
                        <UserCircle
                          className='mr-2.5 h-4 w-4'
                          aria-hidden='true'
                        />
                        {t('navbar.profileSettings')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className='h-9 cursor-pointer'>
                      <Link to='/orders' className='flex w-full items-center'>
                        <CreditCard
                          className='mr-2.5 h-4 w-4'
                          aria-hidden='true'
                        />
                        {t('navbar.orderHistory')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className='h-9 cursor-pointer'>
                      <Link
                        to='/certificates'
                        className='flex w-full items-center'
                      >
                        <Icons.certificate
                          className='mr-2.5 h-4 w-4'
                          aria-hidden='true'
                        />
                        {t('navbar.myCertificates')}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className='h-9 cursor-pointer text-danger focus:text-danger'
                  >
                    <LogOut className='mr-2.5 h-4 w-4' aria-hidden='true' />
                    {t('navbar.logOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className='flex items-center gap-1.5'>
                <Button
                  variant='ghost'
                  onClick={() => {
                    setDefaultAuthTab('login');
                    setAuthModalOpen(true);
                  }}
                  className='h-9 px-3.5 text-sm font-medium'
                >
                  {t('navbar.login')}
                </Button>
                <Button
                  onClick={() => {
                    setDefaultAuthTab('signup');
                    setAuthModalOpen(true);
                  }}
                  className='h-9 px-4 text-sm font-medium'
                >
                  {t('navbar.signup')}
                </Button>
              </div>
            )}
          </div>

          {/* Nút mở menu trên điện thoại */}
          <div className='flex items-center lg:hidden'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setOpenSearchDialog(true)}
              className='mr-0.5 rounded-full text-muted-foreground hover:text-foreground'
            >
              <Icons.search className='h-5 w-5' aria-hidden='true' />
              <span className='sr-only'>{t('navbar.openSearch')}</span>
            </Button>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='rounded-full'
                  aria-label='Mở menu'
                >
                  {mobileMenuOpen ? (
                    <Icons.close className='h-6 w-6' aria-hidden='true' />
                  ) : (
                    <Icons.menu className='h-6 w-6' aria-hidden='true' />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side='left'
                className='flex w-[300px] flex-col p-0'
              >
                <SheetHeader className='border-b border-border p-5 pb-3'>
                  <SheetTitle className='flex items-center'>
                    <Icons.logo className='mr-2 h-7 w-7 text-primary' />
                    <span className='text-xl font-semibold text-foreground'>
                      3TEduTech
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className='flex-1'>
                  <nav className='flex flex-col space-y-1 p-4'>
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.label}>
                        <Link
                          to={link.href}
                          className={cn(
                            'flex items-center rounded-md px-3 py-2.5 text-base font-medium transition-colors',
                            location.pathname.startsWith(link.href)
                              ? 'bg-accent text-primary'
                              : 'text-foreground hover:bg-accent'
                          )}
                        >
                          {link.icon} {t(`navbar.links.${link.label}`)}
                        </Link>
                      </SheetClose>
                    ))}
                    <SheetClose asChild>
                      <Link
                        to='/ai-master'
                        className='mt-1 flex items-center rounded-md bg-primary/10 px-3 py-2.5 text-base font-medium text-primary transition-colors hover:bg-primary/15'
                      >
                        <Sparkles
                          className='mr-3 h-5 w-5'
                          aria-hidden='true'
                        />
                        Bộ công cụ AI Master
                      </Link>
                    </SheetClose>
                  </nav>
                  {isAuthenticated && user && (
                    <>
                      <Separator className='mx-4 my-3' />
                      <div className='space-y-1 p-4 pt-1'>
                        <p className='mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                          Tài khoản của tôi
                        </p>
                        {mobileAccountLinks.map((link) => (
                          <SheetClose asChild key={link.href}>
                            <Link
                              to={link.href}
                              className='flex items-center rounded-md px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-accent'
                            >
                              <span className='mr-3 flex h-5 w-5 items-center justify-center'>
                                {link.icon}
                              </span>
                              {link.label}
                            </Link>
                          </SheetClose>
                        ))}
                        {(user.role === 'AD' || user.role === 'SA') && (
                          <SheetClose asChild>
                            <Link
                              to='/admin'
                              className='flex items-center rounded-md px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-accent'
                            >
                              <LayoutDashboard
                                className='mr-3 h-5 w-5'
                                aria-hidden='true'
                              />
                              {t('navbar.adminPanel')}
                            </Link>
                          </SheetClose>
                        )}
                        {(user.role === 'GV' ||
                          user.role === 'AD' ||
                          user.role === 'SA') && (
                          <SheetClose asChild>
                            <Link
                              to='/instructor'
                              className='flex items-center rounded-md px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-accent'
                            >
                              <BookUser
                                className='mr-3 h-5 w-5'
                                aria-hidden='true'
                              />
                              {t('navbar.instructorHub')}
                            </Link>
                          </SheetClose>
                        )}
                      </div>
                    </>
                  )}
                </ScrollArea>
                <SheetFooter className='mt-auto border-t border-border p-4'>
                  {isAuthenticated ? (
                    <Button
                      variant='ghost'
                      onClick={handleLogout}
                      className='h-11 w-full justify-start text-base text-danger hover:text-danger'
                    >
                      <LogOut className='mr-3 h-5 w-5' aria-hidden='true' />
                      {t('navbar.logOut')}
                    </Button>
                  ) : (
                    <div className='grid w-full grid-cols-2 gap-3'>
                      <SheetClose asChild>
                        <Button
                          variant='outline'
                          className='h-11 w-full text-base'
                          onClick={() => {
                            setDefaultAuthTab('login');
                            setAuthModalOpen(true);
                          }}
                        >
                          {t('navbar.login')}
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          className='h-11 w-full text-base'
                          onClick={() => {
                            setDefaultAuthTab('signup');
                            setAuthModalOpen(true);
                          }}
                        >
                          {t('navbar.signup')}
                        </Button>
                      </SheetClose>
                    </div>
                  )}
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      <SearchCommandDialog
        open={openSearchDialog}
        onOpenChange={setOpenSearchDialog}
      />
      {!isAuthLoading && (
        <AuthModal
          isOpen={authModalOpen && !isAuthenticated}
          onClose={() => setAuthModalOpen(false)}
          defaultTab={defaultAuthTab}
        />
      )}
    </header>
  );
};

export default Navbar;
