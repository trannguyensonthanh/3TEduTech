// import React from 'react';
// import { Button } from '@/components/ui/button';
// import { Icons } from '@/components/common/Icons';
// import { useToast } from '@/components/ui/use-toast';
// import { CopyableField } from '../CopyableField';
// import { useTranslation } from 'react-i18next';

// // Bank account details for bank transfer method
// export interface BankAccountDetails {
//   bankName: string;
//   accountNumber: string;
//   accountHolder: string;
//   branch: string;
//   transferContent: string;
//   qrCodeUrl?: string;
// }

// interface BankTransferPaymentProps {
//   bankDetails: BankAccountDetails;
//   finalAmount: number;
//   onGoBack: () => void;
//   onComplete: () => void;
// }

// export const BankTransferPayment: React.FC<BankTransferPaymentProps> = ({
//   bankDetails,
//   finalAmount,
//   onGoBack,
//   onComplete,
// }) => {
//   const { toast } = useToast();
//   const { t } = useTranslation();

//   return (
//     <div className='space-y-4'>
//       <h3 className='text-xl font-semibold'>
//         {t('bankTransferPayment.title')}
//       </h3>

//       <div className='grid md:grid-cols-2 gap-6'>
//         {/* VietQR Code Section */}
//         <div className='flex flex-col items-center space-y-4'>
//           <div className='bg-white p-4 rounded-lg shadow-sm'>
//             <img
//               src={bankDetails.qrCodeUrl}
//               alt='VietQR Code'
//               className='w-56 h-56 mx-auto'
//             />
//           </div>
//           <div className='text-sm text-center px-4'>
//             <p>{t('bankTransferPayment.qrInstruction')}</p>
//           </div>
//         </div>

//         {/* Bank Details Section */}
//         <div className='rounded-lg border p-4 bg-card'>
//           <CopyableField
//             label={t('bankTransferPayment.bankName')}
//             value={bankDetails.bankName}
//           />
//           <CopyableField
//             label={t('bankTransferPayment.accountNumber')}
//             value={bankDetails.accountNumber}
//           />
//           <CopyableField
//             label={t('bankTransferPayment.accountHolder')}
//             value={bankDetails.accountHolder}
//           />
//           <CopyableField
//             label={t('bankTransferPayment.branch')}
//             value={bankDetails.branch}
//           />

//           <div className='mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20'>
//             <label className='text-sm text-muted-foreground font-medium'>
//               {t('bankTransferPayment.transferContentLabel')}
//             </label>
//             <div className='flex items-center mt-1 p-2 rounded bg-background border'>
//               <div className='flex-1 font-bold'>
//                 {bankDetails.transferContent}
//               </div>
//               <Button
//                 variant='outline'
//                 size='sm'
//                 onClick={() => {
//                   navigator.clipboard.writeText(bankDetails.transferContent);
//                   toast({
//                     title: t('bankTransferPayment.copiedTitle'),
//                     description: t('bankTransferPayment.copiedDesc'),
//                   });
//                 }}
//               >
//                 <Icons.copy className='h-4 w-4 mr-1' />
//                 {t('bankTransferPayment.copyBtn')}
//               </Button>
//             </div>
//           </div>

//           <div className='mt-4 p-3 rounded-lg bg-primary/10'>
//             <div className='font-semibold'>
//               {t('bankTransferPayment.amount', {
//                 amount: finalAmount.toFixed(2),
//               })}
//             </div>
//             <div className='text-sm text-muted-foreground mt-1'>
//               {t('bankTransferPayment.amountNote')}
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className='p-4 rounded-lg bg-muted'>
//         <div className='flex items-start'>
//           <Icons.info className='h-5 w-5 text-primary mr-2 mt-0.5' />
//           <div className='text-sm'>
//             <p>{t('bankTransferPayment.note1')}</p>
//             <p className='mt-1'>{t('bankTransferPayment.note2')}</p>
//           </div>
//         </div>
//       </div>

//       <div className='flex space-x-2'>
//         <Button variant='outline' className='flex-1' onClick={onGoBack}>
//           {t('bankTransferPayment.otherMethod')}
//         </Button>
//         <Button className='flex-1' onClick={onComplete}>
//           {t('bankTransferPayment.completedBtn')}
//         </Button>
//       </div>
//     </div>
//   );
// };
