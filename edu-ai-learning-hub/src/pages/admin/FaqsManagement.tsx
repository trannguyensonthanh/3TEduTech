import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Edit, Trash2, Plus, Loader2, UploadCloud } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { FaqService, FAQ } from '../../services/faqs.service';
import TiptapEditor from '@/components/editor/TiptapEditor';

const FaqsManagement: React.FC = () => {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    isActive: true,
    sortOrder: 0,
  });

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const response = await FaqService.getAll();
      setFaqs(response.data || []);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: (error as Error).message || 'Lỗi khi tải danh sách FAQ',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenDialog = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        isActive: faq.isActive,
        sortOrder: faq.sortOrder,
      });
    } else {
      setEditingFaq(null);
      setFormData({
        question: '',
        answer: '',
        isActive: true,
        sortOrder: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSave = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập đầy đủ câu hỏi và câu trả lời',
        variant: 'destructive'
      });
      return;
    }
    try {
      if (editingFaq) {
        await FaqService.update(editingFaq.faqID, formData);
        toast({ title: 'Thành công', description: 'Cập nhật FAQ thành công' });
      } else {
        await FaqService.create(formData);
        toast({ title: 'Thành công', description: 'Thêm FAQ thành công' });
      }
      setDialogOpen(false);
      fetchFaqs();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: (error as Error).message || 'Lỗi khi lưu FAQ',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa FAQ này?')) {
      try {
        await FaqService.delete(id);
        toast({ title: 'Thành công', description: 'Xóa FAQ thành công' });
        fetchFaqs();
      } catch (error) {
        toast({
          title: 'Lỗi',
          description: (error as Error).message || 'Lỗi khi xóa FAQ',
          variant: 'destructive'
        });
      }
    }
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast({ title: 'Sai định dạng', description: 'Vui lòng chọn file PDF', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File quá lớn', description: 'Vui lòng chọn file dưới 10MB', variant: 'destructive' });
      return;
    }

    setIsUploadingPdf(true);
    try {
      const response = await FaqService.uploadPdf(file);
      const { text, fileName } = response.data;
      
      // Mở modal tạo mới với dữ liệu bóc tách được
      setEditingFaq(null);
      setFormData({
        question: `Tài liệu hệ thống: ${fileName}`,
        answer: text.replace(/\n/g, '<br/>'), // Chuyển xuống dòng thành HTML để Tiptap hiển thị đẹp
        isActive: true,
        sortOrder: 0,
      });
      setDialogOpen(true);
      toast({ title: 'Thành công', description: 'Bóc tách PDF thành công. Hãy kiểm tra và lưu lại!' });
    } catch (error) {
      toast({
        title: 'Lỗi upload',
        description: (error as Error).message || 'Lỗi khi xử lý file PDF',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  // Hàm loại bỏ HTML tags để hiển thị text ngắn gọn trên bảng
  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <div className="p-6 relative">
      {/* Lớp phủ Loading khi đang xử lý PDF */}
      {isUploadingPdf && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-lg font-semibold text-gray-700">Đang bóc tách dữ liệu từ PDF...</p>
          <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý FAQ (Kiến thức AI)</h1>
        <div className="flex space-x-3">
          <input 
            type="file" 
            accept=".pdf" 
            ref={fileInputRef} 
            onChange={handlePdfUpload} 
            className="hidden" 
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingPdf}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Import từ PDF
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm FAQ
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead className="w-1/3">Câu hỏi</TableHead>
                <TableHead className="w-1/3">Trả lời</TableHead>
                <TableHead>Sắp xếp</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.map((faq) => (
                <TableRow key={faq.faqID}>
                  <TableCell>{faq.faqID}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {faq.question}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {stripHtml(faq.answer)}
                  </TableCell>
                  <TableCell>{faq.sortOrder}</TableCell>
                  <TableCell>
                    {faq.isActive ? (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10">
                        Ẩn
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(faq)}
                    >
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(faq.faqID)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {faqs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Chưa có dữ liệu FAQ.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Sửa FAQ' : 'Thêm FAQ mới'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="question">Câu hỏi</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Ví dụ: Làm sao để đăng nhập bằng Google?"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="answer">Trả lời</Label>
              <div className="border rounded-md">
                {dialogOpen && (
                  <TiptapEditor
                    initialContent={formData.answer}
                    onContentChange={(content) => setFormData({ ...formData, answer: content })}
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Thứ tự sắp xếp</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col justify-center gap-2">
                <Label htmlFor="isActive" className="mb-1">Kích hoạt (Đồng bộ với AI)</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">{formData.isActive ? 'Đang hoạt động' : 'Tạm ẩn'}</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaqsManagement;
