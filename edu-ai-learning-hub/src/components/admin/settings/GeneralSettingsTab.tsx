// src/components/admin/settings/GeneralSettingsTab.tsx
import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const SwitchField = ({
  name,
  label,
  description,
}: {
  name: string;
  label: string;
  description: string;
}) => {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
          <div className='space-y-0.5'>
            <FormLabel className='text-base'>{label}</FormLabel>
            <p className='text-sm text-muted-foreground'>{description}</p>
          </div>
          <Switch checked={field.value} onCheckedChange={field.onChange} />
        </FormItem>
      )}
    />
  );
};

export const GeneralSettingsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration Settings</CardTitle>
        <CardDescription>
          Control user and instructor registration on the platform.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <SwitchField
          name='AllowUserRegistration'
          label='Allow New User Registration'
          description='Enable or disable the sign-up functionality for new students.'
        />
        <SwitchField
          name='AllowInstructorRegistration'
          label='Allow Direct Instructor Registration'
          description="Enable or disable the 'Become an Instructor' registration flow."
        />
      </CardContent>
    </Card>
  );
};
