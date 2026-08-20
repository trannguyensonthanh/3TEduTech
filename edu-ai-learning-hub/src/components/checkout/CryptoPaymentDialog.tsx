// src/components/checkout/CryptoPaymentDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { CreateCryptoInvoiceResponse } from '@/services/payment.service';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface CryptoPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  paymentInfo: CreateCryptoInvoiceResponse | null;
}

const CountdownTimer: React.FC<{ expiry: string }> = ({ expiry }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(expiry) - +new Date();
    let timeLeft = { minutes: 0, seconds: 0 };
    if (difference > 0) {
      timeLeft = {
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  return (
    <span className='font-mono font-semibold text-lg text-destructive'>
      {timeLeft.minutes.toString().padStart(2, '0')}:
      {timeLeft.seconds.toString().padStart(2, '0')}
    </span>
  );
};

export const CryptoPaymentDialog: React.FC<CryptoPaymentDialogProps> = ({
  isOpen,
  onClose,
  paymentInfo,
}) => {
  const [isAddressCopied, copyAddress] = useCopyToClipboard();
  const [isAmountCopied, copyAmount] = useCopyToClipboard();
  if (!paymentInfo) return null;

  const handleCopy = (
    text: string,
    copyFn: (text: string) => Promise<boolean>,
    fieldName: string
  ) => {
    copyFn(text).then((success) => {
      if (success) {
        toast.success(`Đã sao chép ${fieldName}.`);
      } else {
        toast.error(`Không sao chép được ${fieldName}.`);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md bg-card'>
        <DialogHeader>
          <DialogTitle className='text-2xl text-center font-bold flex items-center justify-center gap-2'>
            <Icons.bitcoin className='h-7 w-7 text-muted-foreground' />
            Thanh toán bằng tiền mã hóa
          </DialogTitle>
          <DialogDescription className='text-center pt-2'>
            Để hoàn tất đơn hàng, hãy gửi đúng số lượng{' '}
            {paymentInfo.cryptoCurrency.toUpperCase()} tới địa chỉ ví bên dưới.
          </DialogDescription>
        </DialogHeader>

        <div className='py-4 space-y-6'>
          <div className='flex flex-col items-center justify-center bg-muted/50 p-6 rounded-lg'>
            {/* Mã QR phải nằm trên nền sáng thì máy quét mới đọc được, nên
                khối này giữ nền trắng cố định ở cả chế độ sáng lẫn tối. */}
            <div className='rounded-md bg-white p-3'>
              <QRCodeSVG value={paymentInfo.payAddress} size={160} level='H' />
            </div>
            <div className='mt-4 text-center'>
              <p className='text-sm text-muted-foreground'>Hết hạn sau</p>
              <CountdownTimer expiry={paymentInfo.expiresAt} />
            </div>
          </div>

          <div className='space-y-4'>
            {/* Amount */}
            <div className='space-y-1'>
              <Label
                htmlFor='crypto-amount'
                className='text-xs text-muted-foreground'
              >
                Số tiền cần gửi
              </Label>
              <div className='flex items-center'>
                <Input
                  id='crypto-amount'
                  value={paymentInfo.payAmount}
                  readOnly
                  className='font-mono text-base flex-grow'
                />
                <Button
                  variant='ghost'
                  size='icon'
                  className='ml-2'
                  onClick={() =>
                    handleCopy(
                      String(paymentInfo.payAmount),
                      copyAmount,
                      'số tiền'
                    )
                  }
                >
                  {isAmountCopied ? (
                    <Icons.check className='h-4 w-4 text-success' />
                  ) : (
                    <Icons.copy className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>

            {/* Address */}
            <div className='space-y-1'>
              <Label
                htmlFor='crypto-address'
                className='text-xs text-muted-foreground'
              >
                Địa chỉ ví mạng {paymentInfo.network}
              </Label>
              <div className='flex items-center'>
                <Input
                  id='crypto-address'
                  value={paymentInfo.payAddress}
                  readOnly
                  className='font-mono text-base flex-grow'
                />
                <Button
                  variant='ghost'
                  size='icon'
                  className='ml-2'
                  onClick={() =>
                    handleCopy(paymentInfo.payAddress, copyAddress, 'địa chỉ ví')
                  }
                >
                  {isAddressCopied ? (
                    <Icons.check className='h-4 w-4 text-success' />
                  ) : (
                    <Icons.copy className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className='flex-col gap-2 text-center'>
          <div className='flex items-start gap-2 rounded-md bg-warning-soft p-3 text-left text-xs text-warning'>
            <Icons.alertTriangle
              className='mt-0.5 h-4 w-4 shrink-0'
              aria-hidden='true'
            />
            <p>
              <strong>Lưu ý quan trọng:</strong> Chỉ gửi{' '}
              {paymentInfo.cryptoCurrency.toUpperCase()} trên mạng{' '}
              {paymentInfo.network}. Gửi loại tiền khác hoặc dùng mạng khác có
              thể khiến bạn mất toàn bộ số tiền.
            </p>
          </div>
          <Button type='button' className='w-full' onClick={onClose}>
            Tôi đã thanh toán / Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
