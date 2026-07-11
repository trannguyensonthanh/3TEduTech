import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ShieldCheck,
  Boxes,
  BarChart2,
  Settings,
  Tag,
  CreditCard,
  BadgeDollarSign,
  Menu,
  X,
  User,
  Code,
  Layers,
  Coins,
  CreditCard as PaymentMethodIcon,
  Banknote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/common/LanguageToggle';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  const navigationItems = [
    {
      name: t('adminLayout.navigation.dashboard'),
      icon: LayoutDashboard,
      href: '/admin',
      notifications: 0,
    },
    {
      name: t('adminLayout.navigation.users'),
      icon: Users,
      href: '/admin/users',
      notifications: 0,
    },
    {
      name: t('adminLayout.navigation.courses'),
      icon: BookOpen,
      href: '/admin/courses',
      notifications: 0,
    },
    {
      name: t('adminLayout.navigation.courseApprovals'),
      icon: BookOpen,
      href: '/admin/course-approvals',
      notifications: 0,
    },
    {
      name: 'Payouts',
      icon: BarChart2,
      href: '/admin/payouts',
      notifications: 0,
    },
    {
      name: 'Settings',
      icon: Settings,
      href: '/admin/settings',
      notifications: 0,
    },
    {
      name: 'Reports',
      icon: BarChart2,
      href: '/admin/reports',
      notifications: 0,
    },

    {
      name: t('adminLayout.navigation.categories'),
      icon: Boxes,
      href: '/admin/categories',
      notifications: 0,
    },
    {
      name: t('adminLayout.navigation.skills'),
      icon: Code,
      href: '/admin/skills',
      notifications: 0,
    },
    {
      name: t('adminLayout.navigation.currencies'),
      icon: Coins,
      href: '/admin/currencies',
      notifications: 0,
    },
    {
      name: t('adminLayout.navigation.paymentMethods'),
      icon: PaymentMethodIcon,
      href: '/admin/payment-methods',
      notifications: 0,
    },
    {
      name: t('adminLayout.navigation.exchangeRates'),
      icon: Banknote,
      href: '/admin/exchange-rates',
      notifications: 0,
    },
    {
      name: t('adminLayout.navigation.levels'),
      icon: Layers,
      href: '/admin/levels',
      notifications: 0,
    },
    {
      name: t('adminLayout.navigation.promotions'),
      icon: Tag,
      href: '/admin/promotions',
      notifications: 0,
    },
  ];

  return (
    <div className='flex min-h-screen'>
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className='fixed inset-0 z-20 bg-black/50 lg:hidden'
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <ResizablePanelGroup
        direction='horizontal'
        className='min-h-screen w-full'
      >
        {/* Sidebar */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:relative lg:z-0',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            maxSize={30}
            className='h-full bg-background border-r'
          >
            {/* Sidebar Header */}
            <div className='h-16 flex items-center justify-between px-4 border-b'>
              <Link to='/admin' className='flex items-center space-x-2'>
                <ShieldCheck className='h-6 w-6 text-primary' />
                <span className='font-bold text-lg'>
                  {t('adminLayout.title')}
                </span>
              </Link>
              <Button
                variant='ghost'
                size='icon'
                className='lg:hidden'
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className='h-5 w-5' />
              </Button>
            </div>

            {/* Sidebar Navigation with ScrollArea */}
            <ScrollArea className='h-[calc(100vh-4rem)]'>
              <nav className='p-4 space-y-1'>
                {navigationItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.href}
                    className={cn(
                      'flex items-center h-10 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      location.pathname === item.href
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className='h-5 w-5 mr-3' />
                    <span>{item.name}</span>
                    {item.notifications > 0 && (
                      <Badge className='ml-auto' variant='secondary'>
                        {item.notifications}
                      </Badge>
                    )}
                  </Link>
                ))}
              </nav>

              {/* Sidebar Footer */}
              <div className='p-4 border-t mt-4'>
                <Link
                  to='/'
                  className='flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground'
                >
                  <Users className='h-4 w-4' />
                  <span>{t('adminLayout.goToMainSite')}</span>
                </Link>
              </div>
            </ScrollArea>
          </ResizablePanel>
        </div>

        <ResizableHandle withHandle />

        {/* Main Content */}
        <ResizablePanel defaultSize={80}>
          <div className='flex-1 flex flex-col min-w-0 h-screen'>
            {/* Top Navigation */}
            <header className='h-16 border-b flex items-center justify-between px-4 lg:px-6'>
              <div className='flex items-center space-x-4'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='lg:hidden'
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className='h-5 w-5' />
                </Button>
                <h1 className='text-xl font-semibold hidden md:block'>
                  {t('adminLayout.title')}
                </h1>
              </div>

              <div className='flex items-center space-x-4'>
                <LanguageToggle />
                <Link to='/admin/settings'>
                  <div className='w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center'>
                    <User className='h-4 w-4' />
                  </div>
                </Link>
              </div>
            </header>

            {/* Page Content with its own scrolling */}
            <div className='flex-1 overflow-auto'>
              <main className='p-4 lg:p-6'>{children}</main>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default AdminLayout;
