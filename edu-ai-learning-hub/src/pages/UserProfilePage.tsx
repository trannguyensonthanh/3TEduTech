// src/pages/UserProfilePage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useMyProfile } from '@/hooks/queries/user.queries';
import { EditProfileTab } from '@/components/profile/EditProfileTab';
import { AccountSecurityTab } from '@/components/profile/AccountSecurityTab';
// import { PreferencesTab } from '@/components/profile/PreferencesTab';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; // Cho TabsList trên mobile

// Tabs Navigation Data (giống như đã định nghĩa trước)
const profileTabs = [
  {
    value: 'profile',
    label: 'Edit Profile',
    icon: <Icons.userEdit className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />,
  },
  {
    value: 'security',
    label: 'Account Security',
    icon: <Icons.lockKeyhole className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />,
  },
  // {
  //   value: 'preferences',
  //   label: 'Preferences',
  //   icon: <Icons.settings2 className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />,
  // },
  // Thêm các tab khác nếu cần trong tương lai
  // { value: "notifications", label: "Notifications", icon: <Icons.bellRing className="mr-2 h-5 w-5" /> },
  // { value: "billing", label: "Billing", icon: <Icons.creditCard className="mr-2 h-5 w-5" /> },
];

// Animation Variants
const pageContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: 0.1 },
  },
};

const sidebarVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: 0.2 },
  },
};

const mainContentVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: 0.3 },
  },
};

const UserProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const initialTab = queryParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [previousTab, setPreviousTab] = useState(initialTab); // Để xác định hướng trượt

  const { userData: authContextUser } = useAuth();
  const {
    data: userProfile,
    isLoading: isLoadingProfileInitial, // Loading lần đầu
    isFetching: isFetchingProfile, // Loading khi refetch
    error: profileError,
    refetch: refetchProfile,
  } = useMyProfile({
    // enabled: !!authContextUser, // Chỉ fetch khi có user từ context
    staleTime: 1000 * 60 * 5, // Cache 5 phút
  });
  console.log('User Profile:', isFetchingProfile);

  // Ưu tiên userProfile từ API, fallback về authContextUser nếu API chưa load
  const displayUser = userProfile;

  // Đồng bộ activeTab với URL query params
  useEffect(() => {
    const currentTabFromUrl = queryParams.get('tab') || 'profile';
    if (currentTabFromUrl !== activeTab) {
      setPreviousTab(activeTab);
      setActiveTab(currentTabFromUrl);
    }
  }, [queryParams, activeTab]); // Bỏ activeTab khỏi dependency để tránh vòng lặp khi onValueChange của Tabs được gọi

  const handleTabChange = (newTab: string) => {
    setPreviousTab(activeTab);
    setActiveTab(newTab);
    // Cập nhật URL
    const params = new URLSearchParams(location.search);
    if (newTab !== 'profile') {
      params.set('tab', newTab);
    } else {
      params.delete('tab');
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
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

  // Animation cho Tab Content
  const getSlideDirection = (current: string, prev: string) => {
    const currentIndex = profileTabs.findIndex((t) => t.value === current);
    const prevIndex = profileTabs.findIndex((t) => t.value === prev);
    if (prevIndex === -1 || currentIndex === prevIndex) return 0;
    return currentIndex > prevIndex ? 20 : -20; // +20 trượt từ phải, -20 trượt từ trái
  };

  const slideDirection = getSlideDirection(activeTab, previousTab);

  if (isLoadingProfileInitial && !userProfile) {
    return (
      <Layout>
        <div className='container mx-auto px-4 py-12 min-h-[calc(100vh-12rem)] flex items-center justify-center'>
          <Icons.spinner className='h-16 w-16 animate-spin text-primary' />
        </div>
      </Layout>
    );
  }

  if (profileError || !displayUser) {
    return (
      <Layout>
        <div className='container mx-auto px-4 py-12 text-center'>
          <Icons.alertTriangle className='h-16 w-16 mx-auto mb-6 text-destructive' />
          <h2 className='text-2xl font-semibold mb-3 text-destructive-foreground dark:text-destructive'>
            Could Not Load Your Profile
          </h2>
          <p className='text-muted-foreground mb-6'>
            There was an issue fetching your profile data. Please try refreshing
            the page or contact support if the problem persists.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </Layout>
    );
  }
  console.log('Display User:', displayUser);
  return (
    <Layout>
      <motion.div
        variants={pageContainerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Page Header */}
        <div className='bg-slate-50 dark:bg-slate-900/50 border-b border-border/60 dark:border-slate-700/60'>
          <motion.div
            variants={sectionVariants}
            className='container mx-auto px-4 pt-8 pb-6 md:pt-12 md:pb-10'
          >
            <h1 className='text-3xl md:text-4xl font-bold text-foreground tracking-tight'>
              Account Settings
            </h1>
            <p className='mt-1.5 text-muted-foreground text-base md:text-lg'>
              Manage your profile information, security settings, and
              application preferences.
            </p>
          </motion.div>
        </div>

        <div className='container mx-auto px-4 py-8 md:py-10'>
          <div className='grid md:grid-cols-12 gap-8 lg:gap-10 items-start'>
            {/* Sidebar */}
            <motion.aside
              variants={sidebarVariants}
              className='md:col-span-4 lg:col-span-3 md:sticky md:top-24' // top-24 (1.5rem * 4 (navbar h-16) + 1.5rem (padding-top của container này))
            >
              <Card className='shadow-xl dark:bg-slate-800/40 border dark:border-slate-700/50'>
                <CardContent className='p-6'>
                  <div className='flex flex-col items-center space-y-4'>
                    <div className='relative group'>
                      <Avatar className='h-28 w-28 md:h-32 md:w-32 border-4 border-background dark:border-slate-800 shadow-lg'>
                        <AvatarImage
                          src={
                            displayUser.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              displayUser.fullName || 'User'
                            )}&size=256&background=random&font-size=0.33&bold=true&format=svg`
                          }
                          alt={displayUser.fullName}
                        />
                        <AvatarFallback className='text-4xl font-semibold bg-muted'>
                          {getInitials(displayUser.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        variant='outline'
                        size='icon'
                        className='absolute bottom-1 right-1 h-9 w-9 rounded-full bg-background/90 hover:bg-accent group-hover:opacity-100 opacity-0 md:opacity-100 transition-opacity shadow-md border'
                        onClick={() => {
                          handleTabChange(
                            'profile'
                          ); /* TODO: Scroll to avatar upload section */
                        }}
                        aria-label='Change profile picture'
                      >
                        <Icons.edit className='h-4 w-4 text-muted-foreground group-hover:text-primary' />
                      </Button>
                    </div>

                    <div className='text-center'>
                      <h2 className='text-2xl font-bold text-foreground'>
                        {displayUser.fullName}
                      </h2>
                      <p className='text-sm text-primary dark:text-primary/90 font-medium mt-0.5'>
                        {displayUser.headline ||
                          userRoleDisplay(displayUser.roleId)}
                      </p>
                    </div>

                    <Separator className='my-4 dark:bg-slate-700/60 w-full' />

                    <div className='w-full text-sm space-y-3.5 text-left'>
                      <div className='flex items-center text-muted-foreground'>
                        <Icons.mail className='h-4 w-4 mr-3 flex-shrink-0 opacity-80' />
                        <span className='truncate' title={displayUser.email}>
                          {displayUser.email}
                        </span>
                      </div>
                      {displayUser.phoneNumber && (
                        <div className='flex items-center text-muted-foreground'>
                          <Icons.phone className='h-4 w-4 mr-3 flex-shrink-0 opacity-80' />
                          <span>{displayUser.phoneNumber}</span>
                        </div>
                      )}
                      {displayUser.location && (
                        <div className='flex items-center text-muted-foreground'>
                          <Icons.mapPin className='h-4 w-4 mr-3 flex-shrink-0 opacity-80' />
                          <span
                            className='truncate'
                            title={displayUser.location}
                          >
                            {displayUser.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.aside>

            {/* Main Content with Tabs */}
            <motion.div
              variants={mainContentVariants}
              className='md:col-span-8 lg:col-span-9'
            >
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className='w-full'
              >
                <ScrollArea className='w-full pb-1 mb-6 md:mb-8'>
                  <TabsList className='inline-flex h-auto min-w-full sm:min-w-0 sm:w-auto bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg shadow-sm'>
                    {profileTabs.map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className='px-3.5 py-2 sm:px-5 sm:py-2.5 text-sm font-medium flex-1 sm:flex-none data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md h-auto leading-normal'
                      >
                        {React.cloneElement(tab.icon, {
                          className: cn(
                            tab.icon.props.className,
                            'mr-2 h-4 w-4'
                          ),
                        })}
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <ScrollBar orientation='horizontal' />
                </ScrollArea>

                <AnimatePresence mode='wait' initial={false}>
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: slideDirection }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -slideDirection }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <TabsContent
                      value='profile'
                      forceMount={true}
                      className={cn(
                        activeTab !== 'profile' && 'hidden',
                        '!mt-0'
                      )}
                    >
                      {displayUser && (
                        <EditProfileTab
                          userProfile={displayUser}
                          onUpdateSuccess={refetchProfile}
                        />
                      )}
                    </TabsContent>

                    <TabsContent
                      value='security'
                      forceMount={true}
                      className={cn(
                        activeTab !== 'security' && 'hidden',
                        '!mt-0'
                      )}
                    >
                      <AccountSecurityTab />
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default UserProfilePage;
