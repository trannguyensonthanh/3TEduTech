/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
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
import { useFieldArray, useForm } from 'react-hook-form';
import { UserProfile } from '@/services/user.service';
import { useTranslation } from 'react-i18next';

interface SocialLink {
  platform: string;
  url: string;
}

type UserRole = 'NU' | 'GV' | 'AD' | 'SA';
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

interface UserEditDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userData: any) => void;
}

const UserEditDialog = ({
  user,
  open,
  onOpenChange,
  onSave,
}: UserEditDialogProps) => {
  const [formRole, setFormRole] = useState<UserRole>('NU');
  const { t } = useTranslation();

  const form = useForm({
    defaultValues: {
      FullName: '', // Tên thuộc tính đã đổi từ `fullName` sang `FullName`
      Email: '',
      RoleID: 'NU', // Đổi từ `role` sang `RoleID`
      Status: 'ACTIVE',
      Gender: '', // Đổi từ `gender` sang `Gender`
      BirthDate: '', // Đổi từ `birthDate` sang `BirthDate`
      PhoneNumber: '', // Đổi từ `phoneNumber` sang `PhoneNumber`
      Location: '', // Đổi từ `location` sang `Location`
      // Instructor fields
      ProfessionalTitle: '', // Đổi từ `professionalTitle` sang `ProfessionalTitle`
      Bio: '',
      AboutMe: '', // Đổi từ `aboutMe` sang `AboutMe`
      BankAccountNumber: '',
      BankName: '',
      BankAccountHolderName: '',
      Skills: '', // Đổi từ `skills` sang `Skills`
      SocialLinks: [],
    },
  });
  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'SocialLinks', // Tên mảng trong form
  });
  // Update form when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        FullName: user.fullName, // Đổi từ `user.name` sang `user.FullName`
        Email: user.email,
        RoleID: user.roleId, // Đổi từ `user.role` sang `user.RoleID`
        Status: user.status,
        Gender: user.gender || '', // Đổi từ `user.gender` sang `user.Gender`
        BirthDate: user.birthDate || '', // Đổi từ `user.birthDate` sang `user.BirthDate`
        PhoneNumber: user.phoneNumber || '', // Đổi từ `user.phoneNumber` sang `user.PhoneNumber`
        Location: user.location || '', // Đổi từ `user.location` sang `user.Location`
        // Instructor fields
        ProfessionalTitle: user.professionalTitle || '', // Đổi từ `user.professionalTitle` sang `user.ProfessionalTitle`
        Bio: user.bio || '',
        AboutMe: user.aboutMe || '', // Đổi từ `user.aboutMe` sang `user.AboutMe`
        BankAccountNumber: user.bankAccountNumber || '',
        BankName: user.bankName || '',
        BankAccountHolderName: user.bankAccountHolderName || '',
        Skills: user.skills, // Đổi từ `user.skills` sang `user.Skills`
        SocialLinks: user.socialLinks || [],
      });

      setFormRole(user.roleId as UserRole); // Đổi từ `user.role` sang `user.RoleID`
    }
  }, [user, form]);
  const handleAddSocialLink = () => {
    append({ platform: '', url: '' }); // Thêm một liên kết trống
  };
  const handleSubmit = (data: any) => {
    onSave({
      ...data,
      id: user?.accountId,
      createdAt: user?.createdAt,
      courses: user?.courses || 0,
    });
    onOpenChange(false);
  };

  // Handle role change to show/hide instructor fields
  const handleRoleChange = (role: UserRole) => {
    form.setValue('RoleID', role);
    setFormRole(role);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{t('userEditDialog.editTitle')}</DialogTitle>
          <DialogDescription>
            {t('userEditDialog.editDesc', { name: user?.fullName })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-4 py-4'
          >
            <Tabs defaultValue='basic' className='w-full'>
              <TabsList
                className={`grid w-full ${
                  formRole === 'GV' ? 'grid-cols-2' : 'grid-cols-1'
                }`}
              >
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
                  name='FullName'
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
                  name='Email'
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

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='RoleID'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addUserDialog.role')}</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            handleRoleChange(value as UserRole)
                          }
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t(
                                  'addUserDialog.placeholder.role'
                                )}
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

                  <FormField
                    control={form.control}
                    name='Status'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('userEditDialog.status')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t(
                                  'userEditDialog.statusPlaceholder'
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='ACTIVE'>
                              {t('userEditDialog.statusActive')}
                            </SelectItem>
                            <SelectItem value='INACTIVE'>
                              {t('userEditDialog.statusInactive')}
                            </SelectItem>
                            <SelectItem value='BANNED'>
                              {t('userEditDialog.statusBanned')}
                            </SelectItem>
                            <SelectItem value='PENDING_VERIFICATION'>
                              {t('userEditDialog.statusPending')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='Gender'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addUserDialog.gender')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
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
                    name='BirthDate'
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
                    name='PhoneNumber'
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
                    name='Location'
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
                    name='ProfessionalTitle'
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
                    name='Bio'
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
                    name='AboutMe'
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
                    name='Skills'
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
                    <div className='space-y-4 '>
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className='grid grid-cols-12 gap-4 items-center'
                        >
                          <FormField
                            control={control}
                            name={`SocialLinks.${index}.platform`}
                            render={({ field }) => (
                              <FormItem className='col-span-2'>
                                <FormLabel>Platform</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder='e.g., LinkedIn, GitHub'
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={control}
                            name={`SocialLinks.${index}.url`}
                            render={({ field }) => (
                              <FormItem className='col-span-8'>
                                <FormLabel>URL</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder='e.g., https://linkedin.com/in/username'
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type='button'
                            variant='destructive'
                            className='col-span-2 mt-8'
                            onClick={() => remove(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type='button'
                      onClick={handleAddSocialLink}
                      className=' mt-4'
                    >
                      Add Social Link
                    </Button>
                  </div>

                  {/* <div className="space-y-2">
                    <h3 className="text-sm font-medium">Payment Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Bank name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bankAccountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Bank account number"
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
                      name="bankAccountHolderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Holder Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Name as it appears on the account"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div> */}
                </TabsContent>
              )}
            </Tabs>

            <DialogFooter className='pt-4'>
              <Button type='submit'>Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditDialog;
