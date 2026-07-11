/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { UserRole } from './UserTable';
import { useTranslation } from 'react-i18next';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddUser: (userData: any) => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({
  open,
  onOpenChange,
  onAddUser,
}) => {
  const { t } = useTranslation();
  const [formRole, setFormRole] = useState<UserRole>('NU');

  const form = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      role: 'NU',
      password: '',
      confirmPassword: '',
      gender: '',
      birthDate: '',
      phoneNumber: '',
      location: '',
      // Instructor fields
      professionalTitle: '',
      bio: '',
      aboutMe: '',
      bankAccountNumber: '',
      bankName: '',
      bankAccountHolderName: '',
      skills: '',
      linkedinUrl: '',
      githubUrl: '',
      twitterUrl: '',
    },
  });

  const handleSubmit = (data: any) => {
    // In a real app, this would call an API to create the user
    onAddUser(data);
    form.reset();
    setFormRole('NU');
  };

  // Handle role change to show/hide instructor fields
  const handleRoleChange = (role: UserRole) => {
    form.setValue('role', role);
    setFormRole(role);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{t('addUserDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('addUserDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-4 py-4'
          >
            <Tabs defaultValue='basic' className='w-full'>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='basic'>
                  {t('addUserDialog.tabs.basic')}
                </TabsTrigger>
                {formRole === 'GV' && (
                  <TabsTrigger value='instructor'>
                    {t('addUserDialog.tabs.instructor')}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value='basic' className='space-y-4 pt-4'>
                <FormField
                  control={form.control}
                  name='fullName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addUserDialog.fullName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('addUserDialog.placeholder.fullName')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addUserDialog.email')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('addUserDialog.placeholder.email')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='role'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addUserDialog.role')}</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          handleRoleChange(value as UserRole)
                        }
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('addUserDialog.placeholder.role')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='STUDENT'>
                            {t('addUserDialog.roles.student')}
                          </SelectItem>
                          <SelectItem value='INSTRUCTOR'>
                            {t('addUserDialog.roles.instructor')}
                          </SelectItem>
                          <SelectItem value='ADMIN'>
                            {t('addUserDialog.roles.admin')}
                          </SelectItem>
                          <SelectItem value='SUPER_ADMIN'>
                            {t('addUserDialog.roles.superAdmin')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t('addUserDialog.roleDesc')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='password'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addUserDialog.password')}</FormLabel>
                        <FormControl>
                          <Input
                            type='password'
                            placeholder={t(
                              'addUserDialog.placeholder.password'
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='confirmPassword'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('addUserDialog.confirmPassword')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='password'
                            placeholder={t(
                              'addUserDialog.placeholder.confirmPassword'
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='gender'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addUserDialog.gender')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t(
                                  'addUserDialog.placeholder.gender'
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='MALE'>
                              {t('addUserDialog.genders.male')}
                            </SelectItem>
                            <SelectItem value='FEMALE'>
                              {t('addUserDialog.genders.female')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='birthDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addUserDialog.birthDate')}</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='phoneNumber'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addUserDialog.phoneNumber')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'addUserDialog.placeholder.phoneNumber'
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='location'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addUserDialog.location')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'addUserDialog.placeholder.location'
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {formRole === 'GV' && (
                <TabsContent value='instructor' className='space-y-4 pt-4'>
                  <FormField
                    control={form.control}
                    name='professionalTitle'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('addUserDialog.professionalTitle')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'addUserDialog.placeholder.professionalTitle'
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='bio'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addUserDialog.bio')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('addUserDialog.placeholder.bio')}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('addUserDialog.bioDesc')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='aboutMe'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addUserDialog.aboutMe')}</FormLabel>
                        <FormControl>
                          <textarea
                            className='flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                            placeholder={t('addUserDialog.placeholder.aboutMe')}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('addUserDialog.aboutMeDesc')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='skills'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addUserDialog.skills')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('addUserDialog.placeholder.skills')}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('addUserDialog.skillsDesc')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='space-y-2'>
                    <h3 className='text-sm font-medium'>
                      {t('addUserDialog.socialLinks')}
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <FormField
                        control={form.control}
                        name='linkedinUrl'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t(
                                  'addUserDialog.placeholder.linkedinUrl'
                                )}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='githubUrl'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GitHub</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t(
                                  'addUserDialog.placeholder.githubUrl'
                                )}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='twitterUrl'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twitter</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t(
                                  'addUserDialog.placeholder.twitterUrl'
                                )}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <h3 className='text-sm font-medium'>
                      {t('addUserDialog.paymentInfo')}
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <FormField
                        control={form.control}
                        name='bankName'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('addUserDialog.bankName')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t(
                                  'addUserDialog.placeholder.bankName'
                                )}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='bankAccountNumber'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('addUserDialog.bankAccountNumber')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t(
                                  'addUserDialog.placeholder.bankAccountNumber'
                                )}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name='bankAccountHolderName'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('addUserDialog.bankAccountHolderName')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                'addUserDialog.placeholder.bankAccountHolderName'
                              )}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              )}
            </Tabs>

            <DialogFooter className='pt-4'>
              <Button type='submit'>{t('addUserDialog.addButton')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
