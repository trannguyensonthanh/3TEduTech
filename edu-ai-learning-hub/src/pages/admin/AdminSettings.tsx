/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import _ from 'lodash';

// Layout & UI
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/common/Icons';
import FullScreenLoader from '@/components/common/FullScreenLoader';

// Tabs
import { GeneralSettingsTab } from '@/components/admin/settings/GeneralSettingsTab';
import { PaymentSettingsTab } from '@/components/admin/settings/PaymentSettingsTab';

// Logic
import {
  useSettings,
  useUpdateSetting,
} from '@/hooks/queries/settings.queries';
import {
  settingsSchema,
  TSettingsForm,
} from '@/lib/validators/settingsValidator';
import { SettingsResponse } from '@/services/settings.service';
import { boolean, ZodBoolean } from 'zod';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { data: settingsData, isLoading } = useSettings();
  const { mutate: updateSetting, isPending: isUpdating } = useUpdateSetting();

  const form = useForm<TSettingsForm>({
    resolver: zodResolver(settingsSchema),
  });

  // Effect để điền dữ liệu từ API vào form khi có
  useEffect(() => {
    if (settingsData) {
      const editableSettings = Object.entries(settingsData)
        .filter(([, value]) => value.isEditable)
        .reduce((acc, [formKey, value]) => {
          console.log(
            `Setting ${formKey} isEditable: ${value.isEditable}, value: ${value.value}`
          );
          // Ép tất cả value về string để so sánh và xử lý dễ dàng
          acc[formKey] =
            value.value === 'true'
              ? true
              : value.value === 'false'
                ? false
                : value.value;
          return acc;
        }, {} as Partial<TSettingsForm>);

      form.reset(editableSettings);
    }
  }, [settingsData, form]);

  // Hàm xử lý lưu thay đổi settings
  const handleSaveChanges = async (formData: TSettingsForm) => {
    // 1. Xác định các trường đã thay đổi (dirtyFields)
    const dirtyFields = form.formState.dirtyFields;
    // 2. Tạo mảng các setting đã thay đổi
    const changedSettings = Object.keys(dirtyFields).map((key) => {
      const settingKey = key as keyof TSettingsForm;
      return {
        key: settingKey,
        value: String(formData[settingKey]), // Luôn gửi lên dưới dạng string
      };
    });

    if (changedSettings.length === 0) {
      toast.info('No changes to save.');
      return;
    }

    // 3. Tuần tự gửi từng setting thay đổi lên server
    toast.promise(
      (async () => {
        for (const setting of changedSettings) {
          await new Promise((resolve, reject) => {
            updateSetting(
              { settingKey: setting.key, data: { value: setting.value } },
              {
                onSuccess: resolve,
                onError: reject,
              }
            );
          });
        }
      })(),
      {
        loading: 'Saving settings...',
        success: () => {
          // Reset dirty state sau khi lưu thành công
          form.reset(formData, { keepValues: true });
          return `${changedSettings.length} setting(s) updated successfully!`;
        },
        error: (err: any) =>
          err.message || 'An error occurred while saving settings.',
      }
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <FullScreenLoader text='Loading Settings...' />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSaveChanges)}>
          <div className='space-y-6'>
            <header className='flex items-center justify-between'>
              <h1 className='text-3xl font-bold tracking-tight'>
                Platform Settings
              </h1>
              <Button
                type='submit'
                disabled={isUpdating || !form.formState.isDirty}
              >
                {isUpdating ? (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Icons.save className='mr-2 h-4 w-4' />
                )}
                Save Changes
              </Button>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value='general'>General</TabsTrigger>
                <TabsTrigger value='payment'>Payment & Financials</TabsTrigger>
              </TabsList>

              <div className='mt-6'>
                <TabsContent value='general'>
                  <GeneralSettingsTab />
                </TabsContent>
                <TabsContent value='payment'>
                  <PaymentSettingsTab />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </form>
      </FormProvider>
    </AdminLayout>
  );
};

export default AdminSettings;
