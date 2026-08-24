import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';

interface AiDescriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (hints: string) => void;
  isGenerating: boolean;
}

export const AiDescriptionDialog: React.FC<AiDescriptionDialogProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}) => {
  const [hints, setHints] = useState('');

  const handleGenerate = () => {
    onGenerate(hints);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Sparkles className='w-5 h-5 text-indigo-600' />
            AI Sinh Mô Tả Khóa Học
          </DialogTitle>
          <DialogDescription>
            Bởi vì khóa học chưa có bài học, AI cần thêm một số gợi ý để có thể viết mô tả chính xác nhất.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='hints'>Gợi ý cho AI (Tùy chọn nhưng nên có)</Label>
            <Textarea
              id='hints'
              placeholder='Ví dụ: Khóa học lập trình web cơ bản với ReactJS. Đối tượng là người mới bắt đầu. Mục tiêu: tạo được website bán hàng...'
              value={hints}
              onChange={(e) => setHints(e.target.value)}
              rows={4}
            />
            <p className='text-xs text-muted-foreground'>
              Hãy cung cấp chủ đề chính, đối tượng mục tiêu, và các kỹ năng học viên sẽ nhận được.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isGenerating}>
            Hủy
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className='bg-indigo-600 hover:bg-indigo-700 text-white'
          >
            {isGenerating && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
            Tiến hành sinh mô tả
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
