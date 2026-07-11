// import React, { useEffect, useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { QrCode, ArrowRight, LoaderCircle } from 'lucide-react';
// import { Icons } from '@/components/common/Icons';
// import { useTranslation } from 'react-i18next';

// // MoMo payment options
// export type MomoPaymentMode = 'app' | 'qrcode';
// export type MomoPaymentStatus = 'waiting' | 'processing' | 'success' | 'failed';

// interface MomoPaymentProps {
//   momoQrCode: string | null;
//   finalAmount: number;
//   countdownTime: number;
//   momoPaymentMode: MomoPaymentMode;
//   momoPaymentStatus: MomoPaymentStatus;
//   onModeChange: (mode: MomoPaymentMode) => void;
//   onGoBack: () => void;
// }

// export const MomoPayment: React.FC<MomoPaymentProps> = ({
//   momoQrCode,
//   finalAmount,
//   countdownTime,
//   momoPaymentMode,
//   momoPaymentStatus,
//   onModeChange,
//   onGoBack,
// }) => {
//   const { t } = useTranslation();

//   // Format countdown time as MM:SS
//   const formatCountdown = () => {
//     const minutes = Math.floor(countdownTime / 60);
//     const seconds = countdownTime % 60;
//     return `${minutes.toString().padStart(2, '0')}:${seconds
//       .toString()
//       .padStart(2, '0')}`;
//   };

//   return (
//     <div className='text-center space-y-5'>
//       <h3 className='text-xl font-semibold'>{t('momoPayment.title')}</h3>

//       {/* MoMo Payment Mode Selector */}
//       <div className='flex justify-center mb-4'>
//         <Tabs
//           value={momoPaymentMode}
//           onValueChange={(value) => onModeChange(value as MomoPaymentMode)}
//           className='w-full max-w-xs'
//         >
//           <TabsList className='grid w-full grid-cols-2'>
//             <TabsTrigger value='qrcode' className='flex items-center gap-1'>
//               <QrCode className='h-4 w-4' />
//               {t('momoPayment.tabQRCode')}
//             </TabsTrigger>
//             <TabsTrigger value='app' className='flex items-center gap-1'>
//               <ArrowRight className='h-4 w-4' />
//               {t('momoPayment.tabApp')}
//             </TabsTrigger>
//           </TabsList>
//         </Tabs>
//       </div>

//       {momoPaymentMode === 'qrcode' && (
//         <>
//           <div className='text-center space-y-4'>
//             <h4 className='text-lg font-semibold'>
//               {t('momoPayment.qrTitle')}
//             </h4>

//             {momoQrCode && (
//               <div className='flex justify-center'>
//                 <div className='bg-white p-4 rounded-lg shadow-sm'>
//                   <img
//                     src={momoQrCode}
//                     alt='MoMo QR Code'
//                     className='w-64 h-64'
//                   />
//                 </div>
//               </div>
//             )}

//             <div className='text-lg font-bold'>
//               {t('momoPayment.amount', { amount: finalAmount.toFixed(2) })}
//             </div>

//             <div className='text-sm text-muted-foreground max-w-md mx-auto'>
//               {t('momoPayment.qrInstruction')}
//             </div>

//             {countdownTime > 0 ? (
//               <div className='text-sm'>
//                 {t('momoPayment.qrExpire', { time: formatCountdown() })}
//               </div>
//             ) : (
//               <div className='text-red-500 text-sm'>
//                 {t('momoPayment.qrExpired')}
//                 <Button
//                   variant='outline'
//                   size='sm'
//                   className='ml-2'
//                   onClick={onGoBack}
//                 >
//                   {t('momoPayment.retry')}
//                 </Button>
//               </div>
//             )}

//             <div className='p-4 rounded-lg bg-muted mt-4'>
//               <div className='flex items-center justify-center'>
//                 {momoPaymentStatus === 'waiting' && (
//                   <>
//                     <Icons.info className='h-5 w-5 text-primary mr-2' />
//                     <span className='text-sm'>{t('momoPayment.waiting')}</span>
//                   </>
//                 )}
//                 {momoPaymentStatus === 'processing' && (
//                   <>
//                     <LoaderCircle className='h-5 w-5 text-primary mr-2 animate-spin' />
//                     <span className='text-sm'>
//                       {t('momoPayment.processing')}
//                     </span>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
//         </>
//       )}

//       {momoPaymentMode === 'app' && (
//         <div className='text-center space-y-4'>
//           <p className='text-lg'>{t('momoPayment.appInstruction')}</p>

//           <div className='text-lg font-bold'>
//             {t('momoPayment.amount', { amount: finalAmount.toFixed(2) })}
//           </div>

//           <Button className='bg-[#d82d8b] hover:bg-[#c4286f] w-full max-w-xs font-semibold py-6 text-lg'>
//             {t('momoPayment.appBtn')}
//             <ArrowRight className='ml-2 h-5 w-5' />
//           </Button>

//           <p className='text-sm text-muted-foreground'>
//             {t('momoPayment.appNote')}
//           </p>
//         </div>
//       )}

//       <Button variant='outline' className='mt-4' onClick={onGoBack}>
//         {t('momoPayment.otherMethod')}
//       </Button>
//     </div>
//   );
// };
