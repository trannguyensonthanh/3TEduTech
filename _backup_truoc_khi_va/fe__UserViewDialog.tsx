import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserProfile } from '@/services/user.service';

interface SocialLink {
  platform: string;
  url: string;
}

type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'PENDING_VERIFICATION';
type Gender = 'MALE' | 'FEMALE' | null;

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  courses: number;
  gender?: Gender;
  birthDate?: string;
  phoneNumber?: string;
  location?: string;
  // Instructor fields
  professionalTitle?: string;
  bio?: string;
  aboutMe?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankAccountHolderName?: string;
  skills?: string[];
  socialLinks?: SocialLink[];
}

interface UserViewDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserViewDialog = ({ user, open, onOpenChange }: UserViewDialogProps) => {
  const { t } = useTranslation();
  const isInstructor = user.roleId === 'GV';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl max-h-[90vh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle>{t('userViewDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('userViewDialog.description', { name: user.fullName })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[60vh] pr-4'>
          <div className='space-y-6'>
            <div className='flex flex-col md:flex-row md:items-center gap-4'>
              <div className='flex-shrink-0 h-24 w-24 bg-muted rounded-full flex items-center justify-center text-2xl font-bold'>
                {user?.fullName?.charAt(0)}
              </div>

              <div className='space-y-1'>
                <h2 className='text-xl font-bold flex flex-col sm:flex-row sm:items-center gap-2'>
                  {user.fullName}
                  <Badge
                    className={
                      user.roleId === 'SA'
                        ? 'bg-red-500 text-white'
                        : user.roleId === 'AD'
                          ? 'bg-blue-500 text-white'
                          : user.roleId === 'GV'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-500 text-white'
                    }
                  >
                    {t(`userTable.role.${user.roleId}`)}
                  </Badge>
                </h2>
                <p className='text-muted-foreground'>{user.email}</p>
                {isInstructor && user.professionalTitle && (
                  <p className='font-medium'>{user.professionalTitle}</p>
                )}
                <div className='flex items-center gap-2 mt-1'>
                  <Badge
                    className={
                      user.status === 'ACTIVE'
                        ? 'bg-green-500 text-white'
                        : user.status === 'INACTIVE'
                          ? 'bg-yellow-500 text-white'
                          : user.status === 'BANNED'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-400 text-white'
                    }
                  >
                    {t(`userTable.status.${user.status}`)}
                  </Badge>
                  {user.courses > 0 && (
                    <Badge variant='outline'>
                      {user.courses}{' '}
                      {user.courses === 1
                        ? t('userViewDialog.course')
                        : t('userViewDialog.courses')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Tabs defaultValue='profile' className='w-full'>
              <TabsList
                className={`grid w-full ${
                  isInstructor ? 'grid-cols-2' : 'grid-cols-1'
                } mb-4`}
              >
                <TabsTrigger value='profile'>
                  {t('userViewDialog.tabs.profile')}
                </TabsTrigger>
                {isInstructor && (
                  <TabsTrigger value='instructor'>
                    {t('userViewDialog.tabs.instructor')}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value='profile' className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      {t('userViewDialog.label.userId')}
                    </h3>
                    <p>{user.accountId}</p>
                  </div>
                  <div className='space-y-1.5'>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      {t('userViewDialog.label.joinedDate')}
                    </h3>
                    <p>{user.createdAt}</p>
                  </div>
                  <div className='space-y-1.5'>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      {t('userViewDialog.label.email')}
                    </h3>
                    <p>{user.email}</p>
                  </div>
                  <div className='space-y-1.5'>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      {t('userViewDialog.label.phoneNumber')}
                    </h3>
                    <p>{user.phoneNumber || '-'}</p>
                  </div>
                  <div className='space-y-1.5'>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      {t('userViewDialog.label.gender')}
                    </h3>
                    <p>
                      {user.gender
                        ? t(`userViewDialog.gender.${user.gender}`)
                        : '-'}
                    </p>
                  </div>
                  <div className='space-y-1.5'>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      {t('userViewDialog.label.birthDate')}
                    </h3>
                    <p>{user.birthDate || '-'}</p>
                  </div>
                  <div className='space-y-1.5 md:col-span-2'>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      {t('userViewDialog.label.location')}
                    </h3>
                    <p>{user.location || '-'}</p>
                  </div>
                </div>
              </TabsContent>

              {isInstructor && (
                <TabsContent value='instructor' className='space-y-6'>
                  {user.bio && (
                    <div className='space-y-1.5'>
                      <h3 className='text-sm font-medium text-muted-foreground'>
                        {t('userViewDialog.label.bio')}
                      </h3>
                      <p>{user.bio}</p>
                    </div>
                  )}

                  {user.aboutMe && (
                    <div className='space-y-1.5'>
                      <h3 className='text-sm font-medium text-muted-foreground'>
                        {t('userViewDialog.label.aboutMe')}
                      </h3>
                      <div
                        className='prose prose-sm max-w-none'
                        dangerouslySetInnerHTML={{ __html: user.aboutMe }}
                      />
                    </div>
                  )}

                  {user.skills && user.skills.split(',').length > 0 && (
                    <div className='space-y-1.5'>
                      <h3 className='text-sm font-medium text-muted-foreground'>
                        {t('userViewDialog.label.skills')}
                      </h3>
                      <div className='flex flex-wrap gap-1.5'>
                        {user.skills
                          .split(',')
                          .map((skill: string, index: number) => (
                            <Badge key={index} variant='secondary'>
                              {skill}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  {user.socialLinks && user.socialLinks.length > 0 && (
                    <div className='space-y-1.5'>
                      <h3 className='text-sm font-medium text-muted-foreground'>
                        {t('userViewDialog.label.socialLinks')}
                      </h3>
                      <ul className='space-y-1'>
                        {user.socialLinks.map(
                          (
                            link: { platform: string; url: string },
                            index: number
                          ) =>
                            link.url && (
                              <li key={index}>
                                <a
                                  href={link.url}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-blue-600 hover:underline'
                                >
                                  {link.platform}
                                </a>
                              </li>
                            )
                        )}
                      </ul>
                    </div>
                  )}

                  <Separator />
                  {/* <div className="space-y-3">
                    <h3 className="font-medium">Payment Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Bank Name
                        </h3>
                        <p>{user.bankName || '-'}</p>
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Account Holder
                        </h3>
                        <p>{user.bankAccountHolderName || '-'}</p>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Account Number
                        </h3>
                        <p>
                          {user.bankAccountNumber
                            ? '••••••' + user.bankAccountNumber.slice(-4)
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div> */}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {t('userViewDialog.actions.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserViewDialog;
