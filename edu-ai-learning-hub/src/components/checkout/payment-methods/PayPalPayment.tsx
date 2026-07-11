// import React, { useEffect, useRef, useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Icons } from '@/components/common/Icons';
// import { useTranslation } from 'react-i18next';

// interface PayPalPaymentProps {
//   finalAmount: number;
//   isProcessing: boolean;
//   onGoBack: () => void;
// }

// export const PayPalPayment: React.FC<PayPalPaymentProps> = ({
//   finalAmount,
//   isProcessing,
//   onGoBack,
// }) => {
//   const { t } = useTranslation();
//   const paypalButtonRef = useRef<HTMLDivElement>(null);
//   const [paypalButtonRendered, setPaypalButtonRendered] = useState(false);

//   // PayPal script initialization
//   useEffect(() => {
//     if (!paypalButtonRendered && paypalButtonRef.current) {
//       setPaypalButtonRendered(true);

//       setTimeout(() => {
//         if (paypalButtonRef.current) {
//           const mockButton = document.createElement('button');
//           mockButton.className =
//             'py-2 px-4 bg-blue-500 text-white rounded-md w-full font-medium';
//           mockButton.textContent = t('paypalPayment.checkoutBtn');
//           mockButton.onclick = () => {
//             console.log('PayPal checkout initiated');
//           };

//           paypalButtonRef.current.innerHTML = '';
//           paypalButtonRef.current.appendChild(mockButton);
//         }
//       }, 1000);
//     }
//   }, [paypalButtonRendered, t]);

//   return (
//     <div className='space-y-6'>
//       <h3 className='text-xl font-semibold'>{t('paypalPayment.title')}</h3>

//       <div className='p-4 rounded-lg bg-blue-50 border border-blue-200 mb-4'>
//         <div className='flex items-start'>
//           <Icons.info className='h-5 w-5 text-blue-500 mr-2 mt-0.5' />
//           <div className='text-sm text-blue-700'>
//             <p>{t('paypalPayment.info1')}</p>
//             <p className='mt-1'>{t('paypalPayment.info2')}</p>
//           </div>
//         </div>
//       </div>

//       <div className='rounded-lg border p-4 bg-card'>
//         <div className='text-center mb-4'>
//           <div className='flex justify-center mb-4'>
//             <Icons.paypal className='w-16 h-16 text-blue-500' />
//           </div>
//           <p className='font-medium'>{t('paypalPayment.amountLabel')}</p>
//           <p className='text-2xl font-bold mb-4'>${finalAmount.toFixed(2)}</p>
//         </div>

//         {isProcessing ? (
//           <div className='flex justify-center items-center py-4'>
//             <Icons.spinner className='h-6 w-6 animate-spin mr-2' />
//             <span>{t('paypalPayment.processing')}</span>
//           </div>
//         ) : (
//           <div
//             id='paypal-button-container'
//             ref={paypalButtonRef}
//             className='py-4 flex justify-center'
//           >
//             <Button disabled className='w-full'>
//               <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
//               {t('paypalPayment.loading')}
//             </Button>
//           </div>
//         )}
//       </div>

//       <div className='flex space-x-2'>
//         <Button variant='outline' className='w-full' onClick={onGoBack}>
//           {t('paypalPayment.otherMethod')}
//         </Button>
//       </div>
//     </div>
//   );
// };
