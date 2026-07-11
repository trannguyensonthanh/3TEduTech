// import React from 'react';
// import { Button } from '@/components/ui/button';
// import { Icons } from '@/components/common/Icons';
// import { CopyableField } from '../CopyableField';
// import { useTranslation } from 'react-i18next';

// // Crypto payment details
// export interface CryptoPaymentDetails {
//   coin: string;
//   network: string;
//   address: string;
//   amount: string;
// }

// interface CryptoPaymentProps {
//   cryptoDetails: CryptoPaymentDetails;
//   finalAmount: number;
//   onGoBack: () => void;
//   onComplete: () => void;
// }

// export const CryptoPayment: React.FC<CryptoPaymentProps> = ({
//   cryptoDetails,
//   finalAmount,
//   onGoBack,
//   onComplete,
// }) => {
//   const { t } = useTranslation();
//   return (
//     <div className='space-y-4'>
//       <h3 className='text-xl font-semibold'>
//         {t('cryptoPayment.title', { coin: cryptoDetails.coin })}
//       </h3>
//       <div className='rounded-lg border p-4 bg-card'>
//         <CopyableField
//           label={t('cryptoPayment.coinLabel')}
//           value={cryptoDetails.coin}
//         />
//         <CopyableField
//           label={t('cryptoPayment.networkLabel')}
//           value={cryptoDetails.network}
//         />
//         <CopyableField
//           label={t('cryptoPayment.addressLabel')}
//           value={cryptoDetails.address}
//         />
//         <CopyableField
//           label={t('cryptoPayment.amountLabel')}
//           value={cryptoDetails.amount}
//         />
//         <div className='mt-4 p-3 rounded-lg bg-primary/10'>
//           <div className='font-semibold'>
//             {t('cryptoPayment.equivalent', {
//               amount: finalAmount.toFixed(2),
//             })}
//           </div>
//           <div className='text-sm text-muted-foreground mt-1'>
//             {t('cryptoPayment.equivalentNote')}
//           </div>
//         </div>
//       </div>
//       <div className='p-4 rounded-lg bg-muted'>
//         <div className='flex items-start'>
//           <Icons.info className='h-5 w-5 text-primary mr-2 mt-0.5' />
//           <div className='text-sm'>
//             <p>{t('cryptoPayment.note1')}</p>
//             <p className='mt-1'>{t('cryptoPayment.note2')}</p>
//           </div>
//         </div>
//       </div>
//       <div className='flex space-x-2'>
//         <Button variant='outline' className='flex-1' onClick={onGoBack}>
//           {t('cryptoPayment.otherMethod')}
//         </Button>
//         <Button className='flex-1' onClick={onComplete}>
//           {t('cryptoPayment.completedBtn')}
//         </Button>
//       </div>
//     </div>
//   );
// };
