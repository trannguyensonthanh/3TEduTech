import React from 'react';
import { RadioGroup } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentMethodOption } from '@/components/checkout/PaymentMethodOption';
import { useTranslation } from 'react-i18next';

// Types for payment methods
export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'card' | 'bank' | 'digital' | 'crypto';
}

interface PaymentMethodListProps {
  paymentMethods: PaymentMethod[];
  selectedMethod: string;
  onMethodChange: (value: string) => void;
}

export const PaymentMethodList: React.FC<PaymentMethodListProps> = ({
  paymentMethods,
  selectedMethod,
  onMethodChange,
}) => {
  const { t } = useTranslation();
  return (
    <Tabs defaultValue='card' className='w-full'>
      <TabsList className='grid grid-cols-4 mb-4'>
        <TabsTrigger value='card'>{t('paymentMethodList.tabCard')}</TabsTrigger>
        <TabsTrigger value='bank'>{t('paymentMethodList.tabBank')}</TabsTrigger>
        <TabsTrigger value='digital'>
          {t('paymentMethodList.tabDigital')}
        </TabsTrigger>
        <TabsTrigger value='crypto'>
          {t('paymentMethodList.tabCrypto')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value='card' className='space-y-4'>
        <RadioGroup
          value={selectedMethod}
          onValueChange={onMethodChange}
          className='space-y-4'
        >
          {paymentMethods
            .filter((method) => method.category === 'card')
            .map((method) => (
              <PaymentMethodOption
                key={method.id}
                id={method.id}
                name={method.name}
                description={method.description}
                icon={method.icon}
              />
            ))}
        </RadioGroup>
      </TabsContent>

      <TabsContent value='bank' className='space-y-4'>
        <RadioGroup
          value={selectedMethod}
          onValueChange={onMethodChange}
          className='space-y-4'
        >
          {paymentMethods
            .filter((method) => method.category === 'bank')
            .map((method) => (
              <PaymentMethodOption
                key={method.id}
                id={method.id}
                name={method.name}
                description={method.description}
                icon={method.icon}
              />
            ))}
        </RadioGroup>
      </TabsContent>

      <TabsContent value='digital' className='space-y-4'>
        <RadioGroup
          value={selectedMethod}
          onValueChange={onMethodChange}
          className='space-y-4'
        >
          {paymentMethods
            .filter((method) => method.category === 'digital')
            .map((method) => (
              <PaymentMethodOption
                key={method.id}
                id={method.id}
                name={method.name}
                description={method.description}
                icon={method.icon}
              />
            ))}
        </RadioGroup>
      </TabsContent>

      <TabsContent value='crypto' className='space-y-4'>
        <RadioGroup
          value={selectedMethod}
          onValueChange={onMethodChange}
          className='space-y-4'
        >
          {paymentMethods
            .filter((method) => method.category === 'crypto')
            .map((method) => (
              <PaymentMethodOption
                key={method.id}
                id={method.id}
                name={method.name}
                description={method.description}
                icon={method.icon}
              />
            ))}
        </RadioGroup>
      </TabsContent>
    </Tabs>
  );
};
