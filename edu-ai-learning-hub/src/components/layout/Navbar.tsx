// src/components/layout/Navbar.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  SheetDescription, // Thêm nếu cần
  SheetFooter,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '../common/Icons'; // Đảm bảo icons logo, menu, search, course, category, instructors, info, close, etc.
import AuthModal from '../auth/AuthModal';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import CartDropdown from './CartDropdown';
import { SearchCommandDialog } from '../search/SearchCommandDialog'; // Dialog tìm kiếm
import { useAuth } from '@/contexts/AuthContext';
import { useLogoutMutation } from '@/hooks/queries/auth.queries';
import { useMyCart } from '@/hooks/queries/cart.queries';
import { useTheme } from '@/contexts/ThemeContext'; // Hoặc import { useTheme as useNextThemes } from "next-themes";
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  Sun,
  LogOut,
  LayoutDashboard,
  BookUser,
  UserCircle,
  Settings,
  GraduationCap,
  CreditCard,
  Search as SearchIcon,
  Info,
  BookMarked,
  Users,
  Home,
  KeyRound,
  // Thêm các icon khác nếu cần trực tiếp từ lucide-react
} from 'lucide-react';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { useTranslation } from 'react-i18next';

// Navigation Links Data
const navLinks = [
  {
    href: '/courses',
    label: 'Courses',
    icon: <Icons.course className='mr-3 h-5 w-5 opacity-80' />,
  },
  {
    href: '/categories',
    label: 'Categories',
    icon: <Icons.folder className='mr-3 h-5 w-5 opacity-80' />,
  },
  {
    href: '/instructors',
    label: 'Instructors',
    icon: <Icons.instructors className='mr-3 h-5 w-5 opacity-80' />,
  },
  {
    href: '/about',
    label: 'About Us',
    icon: <Icons.info className='mr-3 h-5 w-5 opacity-80' />,
  },
  // { href: "/pricing", label: "Pricing", icon: <DollarSign className="mr-3 h-5 w-5 opacity-80" /> },
  // { href: "/blog", label: "Blog", icon: <BookMarked className="mr-3 h-5 w-5 opacity-80" /> },
];

const Navbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [defaultAuthTab, setDefaultAuthTab] = useState<'login' | 'signup'>(
    'login'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSearchDialog, setOpenSearchDialog] = useState(false);

  const { data: cartData } = useMyCart();
  const cartItemCount = cartData?.items?.length || 0;

  const { theme, setTheme } = useTheme(); // từ ThemeContext wrapper
  // const { theme, setTheme } = useNextThemes(); // nếu dùng trực tiếp

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
    if (!roleId) return 'Member';
    switch (roleId) {
      case 'AD':
        return 'Administrator';
      case 'SA':
        return 'Super Admin';
      case 'GV':
        return 'Instructor';
      case 'NU':
      default:
        return 'Student';
    }
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full border-b transition-all duration-300 ease-out',
          isScrolled
            ? 'shadow-md border-border/70 bg-background/95 backdrop-blur-md dark:bg-slate-900/95'
            : 'border-transparent bg-background/80 dark:bg-slate-900/80'
        )}
      >
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div
            className={cn(
              'flex items-center justify-between transition-[height] duration-300 ease-out',
              isScrolled ? 'h-16' : 'h-20'
            )}
          >
            {/* Logo and Main Navigation (Desktop) */}
            <div className='flex items-center'>
              <Link
                to='/'
                className='flex items-center space-x-2.5 mr-4 lg:mr-6 group shrink-0'
              >
                <Icons.logo
                  className={cn(
                    'text-primary transition-all duration-300 group-hover:rotate-[15deg]',
                    isScrolled ? 'h-8 w-8' : 'h-9 w-9'
                  )}
                />
                <span
                  className={cn(
                    'font-bold text-foreground group-hover:text-primary transition-all duration-300',
                    isScrolled ? 'text-xl' : 'text-2xl'
                  )}
                >
                  3TEduTech
                </span>
              </Link>
              <nav className='hidden lg:flex items-center space-x-0.5 xl:space-x-1'>
                {navLinks.map((link) => (
                  <Button
                    key={link.label}
                    variant='ghost'
                    asChild
                    className={cn(
                      'text-sm font-medium px-3 py-2 xl:px-3.5 rounded-md transition-colors duration-200 h-9',
                      location.pathname === link.href ||
                        (link.href !== '/' &&
                          location.pathname.startsWith(link.href))
                        ? 'text-primary bg-primary/10 dark:bg-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-accent/70'
                    )}
                  >
                    <Link to={link.href}>
                      {t(`navbar.links.${link.label}`)}
                    </Link>
                  </Button>
                ))}
              </nav>
            </div>

            {/* Right Section: Search, Theme, Actions (Desktop) */}
            <div className='hidden lg:flex items-center space-x-2'>
              <LanguageToggle />
              <Button
                variant='outline'
                onClick={() => setOpenSearchDialog(true)}
                className='h-10 w-auto px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 dark:bg-slate-800/60 dark:border-slate-700/70 dark:hover:bg-slate-700/80 justify-start'
                aria-label='Search courses'
              >
                <Icons.search className='mr-2 h-4 w-4' />
                {t('navbar.search')}
                <kbd className='ml-auto pl-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100'>
                  <span className='text-xs'>⌘</span>K
                </kbd>
              </Button>

              <Button
                variant='ghost'
                size='icon'
                onClick={toggleTheme}
                className='rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/80'
                aria-label='Toggle theme'
              >
                <Sun className='h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
                <Moon className='absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
              </Button>

              {isAuthenticated && (
                <>
                  {' '}
                  <NotificationDropdown /> <CartDropdown />{' '}
                </>
              )}

              {isAuthLoading ? (
                <Skeleton className='h-10 w-10 rounded-full' />
              ) : isAuthenticated && user ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      className='relative h-10 w-10 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background group'
                    >
                      <Avatar className='h-9 w-9 border-2 border-transparent group-hover:border-primary/60 dark:group-hover:border-primary/50 transition-all group-focus-visible:border-primary'>
                        <AvatarImage
                          src={
                            user.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.fullName || 'User'
                            )}&background=random&size=96&font-size=0.4&bold=true&format=svg`
                          }
                          alt={user.fullName || 'User'}
                        />
                        <AvatarFallback className='bg-muted text-muted-foreground font-semibold border border-border'>
                          {getInitials(user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className='w-60 p-2 shadow-xl dark:bg-slate-800 border dark:border-slate-700'
                    align='end'
                    forceMount
                  >
                    <div className='flex items-center p-2 mb-1'>
                      <Avatar className='h-11 w-11 mr-3 border'>
                        <AvatarImage
                          src={
                            user.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.fullName || 'User'
                            )}&background=random&size=128&font-size=0.4&bold=true&format=svg`
                          }
                          alt={user.fullName || 'User'}
                        />
                        <AvatarFallback>
                          {getInitials(user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex flex-col space-y-0.5 overflow-hidden'>
                        <p
                          className='text-sm font-semibold leading-none text-foreground truncate'
                          title={user.fullName || 'Valued User'}
                        >
                          {user.fullName || 'Valued User'}
                        </p>
                        <p
                          className='text-xs leading-tight text-muted-foreground truncate'
                          title={user.email}
                        >
                          {user.email}
                        </p>
                        <p
                          className='text-[11px] leading-tight text-primary dark:text-primary/80 font-medium mt-0.5'
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
                          <DropdownMenuItem
                            asChild
                            className='cursor-pointer h-9'
                          >
                            <Link
                              to='/admin'
                              className='flex items-center w-full'
                            >
                              <LayoutDashboard className='mr-2.5 h-4 w-4 opacity-80' />
                              {t('navbar.adminPanel')}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(user.role === 'GV' ||
                          user.role === 'AD' ||
                          user.role === 'SA') && (
                          <DropdownMenuItem
                            asChild
                            className='cursor-pointer h-9'
                          >
                            <Link
                              to='/instructor/earnings'
                              className='flex items-center w-full'
                            >
                              <BookUser className='mr-2.5 h-4 w-4 opacity-80' />
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
                      <DropdownMenuLabel>
                        {t('navbar.mySpace')}
                      </DropdownMenuLabel>
                      <DropdownMenuItem asChild className='cursor-pointer h-9'>
                        <Link
                          to='/my-courses'
                          className='flex items-center w-full'
                        >
                          <GraduationCap className='mr-2.5 h-4 w-4 opacity-80' />
                          {t('navbar.myLearning')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className='cursor-pointer h-9'>
                        <Link
                          to='/profile'
                          className='flex items-center w-full'
                        >
                          <UserCircle className='mr-2.5 h-4 w-4 opacity-80' />
                          {t('navbar.profileSettings')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className='cursor-pointer h-9'>
                        <Link to='/orders' className='flex items-center w-full'>
                          <CreditCard className='mr-2.5 h-4 w-4 opacity-80' />
                          {t('navbar.orderHistory')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className='cursor-pointer h-9'>
                        <Link
                          to='/certificates'
                          className='flex items-center w-full'
                        >
                          <Icons.certificate className='mr-2.5 h-4 w-4 opacity-80' />
                          {t('navbar.myCertificates')}
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className='cursor-pointer h-9 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-700 dark:focus:text-red-400'
                    >
                      <LogOut className='mr-2.5 h-4 w-4 opacity-80' />
                      {t('navbar.logOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className='flex items-center space-x-1.5'>
                  <Button
                    variant='ghost'
                    onClick={() => {
                      setDefaultAuthTab('login');
                      setAuthModalOpen(true);
                    }}
                    className='text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent h-9 px-3.5'
                  >
                    {t('navbar.login')}
                  </Button>
                  <Button
                    onClick={() => {
                      setDefaultAuthTab('signup');
                      setAuthModalOpen(true);
                    }}
                    className='text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 shadow hover:shadow-md transition-shadow'
                  >
                    {t('navbar.signup')}
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <div className='flex lg:hidden items-center'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setOpenSearchDialog(true)}
                className='rounded-full mr-0.5 text-muted-foreground hover:text-foreground hover:bg-accent'
              >
                <Icons.search className='h-5 w-5' />
                <span className='sr-only'>{t('navbar.openSearch')}</span>
              </Button>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='rounded-full text-foreground hover:bg-accent'
                    aria-label='Open mobile menu'
                  >
                    {mobileMenuOpen ? (
                      <Icons.close className='h-6 w-6' />
                    ) : (
                      <Icons.menu className='h-6 w-6' />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side='left'
                  className='w-[300px] p-0 flex flex-col bg-background dark:bg-slate-900 shadow-2xl border-r dark:border-slate-700/80'
                >
                  <SheetHeader className='p-5 pb-3 border-b dark:border-slate-700/80'>
                    <SheetTitle className='flex items-center'>
                      <Icons.logo className='h-7 w-7 mr-2 text-primary' />
                      <span className='text-xl font-bold text-foreground'>
                        3TEduTech
                      </span>
                    </SheetTitle>
                  </SheetHeader>
                  <ScrollArea className='flex-1 custom-scrollbar'>
                    <nav className='flex flex-col space-y-1 p-4'>
                      {navLinks.map((link) => (
                        <SheetClose asChild key={link.label}>
                          <Link
                            to={link.href}
                            className={cn(
                              'flex items-center px-3 py-2.5 rounded-md text-base font-medium transition-colors',
                              location.pathname.startsWith(link.href)
                                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                : 'text-foreground/80 hover:bg-accent dark:hover:bg-accent/70 hover:text-foreground'
                            )}
                          >
                            {link.icon} {t(`navbar.links.${link.label}`)}
                          </Link>
                        </SheetClose>
                      ))}
                    </nav>
                    {isAuthenticated && user && (
                      <Separator className='my-3 mx-4 dark:bg-slate-700/80' />
                    )}
                    {isAuthenticated && user && (
                      <div className='p-4 pt-1 space-y-1'>
                        <p className='px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2'>
                          My Account
                        </p>
                        {[
                          {
                            href: '/my-courses',
                            label: 'My Learning',
                            icon: <GraduationCap />,
                          },
                          {
                            href: '/profile',
                            label: 'Profile & Settings',
                            icon: <UserCircle />,
                          },
                          {
                            href: '/orders',
                            label: 'Order History',
                            icon: <CreditCard />,
                          },
                          {
                            href: '/certificates',
                            label: 'My Certificates',
                            icon: <Icons.certificate />,
                          },
                        ].map((link) => (
                          <SheetClose asChild key={link.label}>
                            <Link
                              to={link.href}
                              className='flex items-center px-3 py-2.5 rounded-md text-base font-medium transition-colors text-foreground/80 hover:bg-accent dark:hover:bg-accent/70 hover:text-foreground'
                            >
                              <span className='mr-3 h-5 w-5 opacity-80 flex items-center justify-center'>
                                {link.icon}
                              </span>{' '}
                              {link.label}
                            </Link>
                          </SheetClose>
                        ))}
                        {(user.role === 'AD' || user.role === 'SA') && (
                          <SheetClose asChild>
                            <Link
                              to='/admin'
                              className='flex items-center px-3 py-2.5 rounded-md text-base font-medium transition-colors text-foreground/80 hover:bg-accent dark:hover:bg-accent/70 hover:text-foreground'
                            >
                              <LayoutDashboard className='mr-3 h-5 w-5 opacity-80' />
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
                              className='flex items-center px-3 py-2.5 rounded-md text-base font-medium transition-colors text-foreground/80 hover:bg-accent dark:hover:bg-accent/70 hover:text-foreground'
                            >
                              <BookUser className='mr-3 h-5 w-5 opacity-80' />
                              {t('navbar.instructorHub')}
                            </Link>
                          </SheetClose>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                  <SheetFooter className='p-4 mt-auto border-t dark:border-slate-700/80'>
                    {isAuthenticated ? (
                      <Button
                        variant='ghost'
                        onClick={handleLogout}
                        className='w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-500 h-11 text-base'
                      >
                        <LogOut className='mr-3 h-5 w-5 opacity-80' />{' '}
                        {t('navbar.logOut')}
                      </Button>
                    ) : (
                      <div className='grid grid-cols-2 gap-3'>
                        <SheetClose asChild>
                          <Button
                            variant='outline'
                            className='w-full h-11 text-base'
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
                            className='w-full h-11 text-base'
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
    </>
  );
};

export default Navbar;
