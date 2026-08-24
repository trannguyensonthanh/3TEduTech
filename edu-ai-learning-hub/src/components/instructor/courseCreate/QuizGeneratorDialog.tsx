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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGenerateLessonQuiz } from '@/hooks/queries/lesson.queries';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuizGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  lessonId: number;
}

const QuizGeneratorDialog: React.FC<QuizGeneratorDialogProps> = ({
  open,
  onClose,
  lessonId,
}) => {
  const [questionsPerLesson, setQuestionsPerLesson] = useState(3);
  const [difficulty, setDifficulty] = useState('mixed');

  const { mutate: generateQuiz, isPending: isGenerating } = useGenerateLessonQuiz({
    onSuccess: (data) => {
      toast.success(data?.message || 'Sinh câu hỏi thành công.');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi sinh câu hỏi.');
    },
  });

  const handleGenerate = () => {
    generateQuiz({ lessonId, questionsPerLesson, difficulty });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Sparkles className='h-5 w-5 text-indigo-500' />
            Sinh câu hỏi bằng AI
          </DialogTitle>
          <DialogDescription>
            AI sẽ đọc nội dung bài học của bạn (phần văn bản) và sinh ra các câu hỏi trắc nghiệm tương ứng.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='questionsCount' className='text-right'>
              Số lượng
            </Label>
            <Input
              id='questionsCount'
              type='number'
              min={1}
              max={10}
              value={questionsPerLesson}
              onChange={(e) => setQuestionsPerLesson(Number(e.target.value))}
              className='col-span-3'
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='difficulty' className='text-right'>
              Độ khó
            </Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className='col-span-3'>
                <SelectValue placeholder='Chọn độ khó' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='easy'>Dễ</SelectItem>
                <SelectItem value='mixed'>Hỗn hợp</SelectItem>
                <SelectItem value='hard'>Khó</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isGenerating}>
            Hủy
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className='bg-indigo-600 hover:bg-indigo-700'
          >
            {isGenerating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Tạo câu hỏi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuizGeneratorDialog;
