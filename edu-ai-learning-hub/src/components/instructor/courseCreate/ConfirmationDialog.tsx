// src/components/common/DeleteConfirmationDialog.tsx
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // Import nếu bạn muốn dùng trigger thay vì kiểm soát open từ bên ngoài
} from '@/components/ui/alert-dialog';
import { Button, ButtonProps } from '@/components/ui/button'; // Import ButtonProps
import { Loader2 } from 'lucide-react'; // Import icon loading

interface ConfirmationDialogProps {
  open?: boolean; // Prop open là tùy chọn nếu dùng Trigger
  onOpenChange?: (open: boolean) => void; // Prop này cũng tùy chọn
  trigger?: React.ReactNode; // Phần tử kích hoạt Dialog (ví dụ: một Button)
  onConfirm: () => Promise<void> | void; // Hàm xác nhận, có thể là async
  title?: string;
  description?: React.ReactNode; // Cho phép truyền cả component vào description
  itemName?: string; // Tên cụ thể của mục (tùy chọn)
  confirmText?: string; // Text cho nút xác nhận
  confirmVariant?: ButtonProps['variant']; // Variant cho nút xác nhận
  cancelText?: string; // Text cho nút hủy
  isConfirming?: boolean; // Trạng thái đang xử lý của hành động confirm
}

/**
 * Component Dialog dùng để xác nhận các hành động quan trọng (Xóa, Gửi duyệt, etc.)
 * Sử dụng AlertDialog của shadcn/ui.
 */
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  trigger,
  onConfirm,
  title = 'Are you sure?', // Tiêu đề mặc định chung chung hơn
  description = 'This action might be irreversible. Please confirm you want to proceed.', // Mô tả mặc định
  itemName,
  confirmText = 'Confirm', // Text nút confirm mặc định
  confirmVariant = 'default', // Variant nút confirm mặc định
  cancelText = 'Cancel',
  isConfirming = false, // Mặc định không có loading
}) => {
  const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Ngăn chặn hành vi mặc định nếu nút nằm trong form
    if (isConfirming) return; // Không cho click lại khi đang xử lý
    try {
      await onConfirm(); // Gọi hàm onConfirm (có thể là async)
      // Việc đóng dialog nên được xử lý bên trong onConfirm thành công ở component cha
      // Hoặc nếu muốn đóng luôn ở đây: onOpenChange?.(false);
    } catch (error) {
      console.error('Confirmation action failed:', error);
      // Lỗi đã được xử lý ở nơi gọi onConfirm (ví dụ: bằng toast)
    }
  };

  const dialogContent = (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>
          {description}
          {itemName && (
            <span className="block mt-2 font-medium">
              {/* Có thể thêm câu hỏi cụ thể hơn */}
              Please confirm the action for:{' '}
              <span className="font-semibold">{itemName}</span>.
            </span>
          )}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        {/* Nút Cancel */}
        <AlertDialogCancel asChild>
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={isConfirming}
          >
            {cancelText}
          </Button>
        </AlertDialogCancel>
        {/* Nút Confirm */}
        <AlertDialogAction asChild>
          {/* Dùng Button thường để có thể kiểm soát disable và loading */}
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  // Nếu có trigger, dùng AlertDialog với Trigger
  if (trigger) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        {dialogContent}
      </AlertDialog>
    );
  }

  // Nếu không có trigger, kiểm soát open/onOpenChange từ bên ngoài
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {dialogContent}
    </AlertDialog>
  );
};

// Đổi tên export nếu muốn giữ tên cũ DeleteConfirmationDialog
// export default DeleteConfirmationDialog;
// Hoặc đổi tên file và component thành ConfirmationDialog
export default ConfirmationDialog;
