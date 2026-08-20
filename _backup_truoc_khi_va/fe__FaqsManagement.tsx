/* ============================================================================
 * FaqsManagement.tsx
 *
 * [VIẾT LẠI 18/08/2026] Trang quản lý tri thức nền của chatbot.
 *
 * ----------------------------------------------------------------------------
 * ★ VÌ SAO KHÔNG CÒN NÚT THÊM / SỬA / XÓA FAQ
 *
 * Nội dung FAQ nay nằm trong mã nguồn backend (src/api/faqs/faqs.data.js), và
 * ba thao tác ghi đều trả HTTP 501. Giữ lại các nút đó chỉ để người dùng gõ
 * xong rồi nhận lỗi là tệ hơn hẳn việc nói thẳng ngay từ đầu.
 *
 * Đổi lại, phần TÀI LIỆU CHÍNH SÁCH bên dưới mới là chỗ quản trị viên thật sự
 * thêm được tri thức mới cho chatbot mà không cần deploy.
 *
 * ----------------------------------------------------------------------------
 * ★ BẢN CŨ CỦA TRANG NÀY CHƯA TỪNG HOẠT ĐỘNG
 *
 * Nút "Import từ PDF" gọi `FaqService.uploadPdf`, mà hàm đó truyền FormData
 * vào `apiHelper.post` — nơi chạy `JSON.stringify` lên nó, biến cả tệp thành
 * chuỗi `"{}"`. Kể cả nếu qua được, endpoint phía backend lại `require` một gói
 * không hề được cài. Chi tiết trong ghi chú đầu tệp services/faqs.service.ts.
 * ========================================================================== */

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
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Trash2,
  Loader2,
  UploadCloud,
  FileText,
  ExternalLink,
  Eye,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  FaqService,
  FaqDocumentService,
  FAQ,
  FaqDocument,
} from '../../services/faqs.service';

/** Định dạng nhận vào — phải khớp `ALLOWED` ở backend (faqDocuments.service.js). */
const ACCEPTED_EXT = '.pdf,.docx';
const ACCEPTED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
/** Khớp FAQ_DOC_MAX_MB mặc định ở backend. */
const MAX_MB = 10;

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatDate = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN');
};

const stripHtml = (html: string) => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html || '';
  return tmp.textContent || tmp.innerText || '';
};

const FaqsManagement: React.FC = () => {
  const { toast } = useToast();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [documents, setDocuments] = useState<FaqDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hộp thoại xem nội dung đã bóc
  const [viewing, setViewing] = useState<FaqDocument | null>(null);
  const [viewText, setViewText] = useState('');
  const [viewLoading, setViewLoading] = useState(false);

  // Hộp thoại nhập tiêu đề trước khi tải lên
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingTitle, setPendingTitle] = useState('');
  const [pendingCategory, setPendingCategory] = useState('Chính sách');

  const fetchAll = async () => {
    setLoading(true);
    try {
      /* Chạy song song và dùng allSettled: danh sách FAQ đến từ mã nguồn nên
         gần như không bao giờ hỏng, còn danh sách tài liệu phụ thuộc vào đĩa và
         Cloudinary. Nếu dùng Promise.all, một bên hỏng sẽ làm TRỐNG cả trang —
         quản trị viên mất luôn phần vẫn đang chạy tốt. */
      const [faqRes, docRes] = await Promise.allSettled([
        FaqService.getAll(),
        FaqDocumentService.list(),
      ]);

      if (faqRes.status === 'fulfilled') setFaqs(faqRes.value.data || []);
      else
        toast({
          title: 'Không tải được danh sách FAQ',
          description: (faqRes.reason as Error)?.message,
          variant: 'destructive',
        });

      if (docRes.status === 'fulfilled') setDocuments(docRes.value.data || []);
      else
        toast({
          title: 'Không tải được danh sách tài liệu',
          description: (docRes.reason as Error)?.message,
          variant: 'destructive',
        });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Kiểm tra phía trình duyệt chỉ để phản hồi NHANH cho người dùng.
     Backend kiểm tra lại toàn bộ (kể cả chữ ký ở đầu tệp) — đừng bao giờ coi
     lớp này là lớp bảo vệ. */
  const handleFilePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    if (!ACCEPTED_MIME.includes(file.type)) {
      toast({
        title: 'Sai định dạng',
        description: 'Chỉ nhận tài liệu PDF hoặc Word (.docx).',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast({
        title: 'Tệp quá lớn',
        description: `Kích thước tối đa là ${MAX_MB}MB.`,
        variant: 'destructive',
      });
      return;
    }

    setPendingFile(file);
    // Bỏ phần mở rộng, dùng tên tệp làm tiêu đề gợi ý.
    setPendingTitle(file.name.replace(/\.[^.]+$/, ''));
    setPendingCategory('Chính sách');
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    const file = pendingFile;
    const title = pendingTitle.trim();
    const category = pendingCategory.trim();

    setPendingFile(null);
    setUploading(true);
    try {
      const res = await FaqDocumentService.upload(file, { title, category });
      const doc = res.data;

      toast({
        title: 'Đã nạp vào tri thức chatbot',
        description: `"${doc.title}" — bóc được ${doc.chars.toLocaleString('vi-VN')} ký tự.`,
      });
      if (doc.warnings?.length) {
        toast({
          title: 'Lưu ý về tệp vừa tải',
          description: doc.warnings.join(' '),
        });
      }
      await fetchAll();
    } catch (error) {
      toast({
        title: 'Tải lên thất bại',
        description:
          (error as Error)?.message ||
          'Không rõ nguyên nhân. Hãy kiểm tra log của backend.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (doc: FaqDocument) => {
    setViewing(doc);
    setViewText('');
    setViewLoading(true);
    try {
      const res = await FaqDocumentService.getText(doc.docId);
      setViewText(res.data.text || '');
    } catch (error) {
      setViewText('');
      toast({
        title: 'Không xem được nội dung',
        description: (error as Error)?.message,
        variant: 'destructive',
      });
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = async (doc: FaqDocument) => {
    const confirmed = window.confirm(
      `Xóa "${doc.title}"?\n\n` +
        'Chatbot sẽ không còn trả lời dựa trên tài liệu này, và tệp gốc cũng bị ' +
        'gỡ khỏi Cloudinary. Thao tác không hoàn tác được.'
    );
    if (!confirmed) return;

    setDeletingId(doc.docId);
    try {
      await FaqDocumentService.remove(doc.docId);
      toast({ title: 'Đã xóa', description: doc.title });
      await fetchAll();
    } catch (error) {
      toast({
        title: 'Xóa thất bại',
        description: (error as Error)?.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tri thức nền của Trợ lý AI</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mọi nội dung trên trang này được nạp vào kho vector và trở thành căn cứ
          để chatbot trả lời học viên.
        </p>
      </div>

      {/* ==================== TÀI LIỆU CHÍNH SÁCH ==================== */}
      <section className="space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold">Tài liệu chính sách</h2>
            <p className="text-sm text-muted-foreground">
              PDF hoặc Word (.docx), tối đa {MAX_MB}MB. Hệ thống bóc nội dung để
              dạy chatbot, tệp gốc vẫn xem lại được ở đây.
            </p>
          </div>
          <div>
            <input
              type="file"
              accept={ACCEPTED_EXT}
              ref={fileInputRef}
              onChange={handleFilePicked}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              {uploading ? 'Đang xử lý…' : 'Tải tài liệu lên'}
            </Button>
          </div>
        </div>

        {/* Cảnh báo về prompt injection — quản trị viên cần biết mình đang làm gì */}
        <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>
            Chỉ tải lên tài liệu do chính đội ngũ soạn. Nội dung tệp đi thẳng vào
            ngữ cảnh trả lời của chatbot, nên một tài liệu từ nguồn không tin cậy
            có thể khiến trợ lý nói sai chính sách với người dùng thật.
          </p>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Tiêu đề</TableHead>
                <TableHead>Nhóm</TableHead>
                <TableHead>Tệp</TableHead>
                <TableHead className="text-right">Nội dung</TableHead>
                <TableHead>Tải lên lúc</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                documents.map((doc) => (
                  <TableRow key={doc.docId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[260px]">{doc.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{doc.category}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="truncate block max-w-[180px]">
                        {doc.fileName}
                      </span>
                      <span className="text-xs">{formatBytes(doc.sizeBytes)}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {doc.chars.toLocaleString('vi-VN')} ký tự
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(doc.uploadedAt)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xem nội dung đã bóc"
                        onClick={() => handleView(doc)}
                      >
                        <Eye className="h-4 w-4 text-blue-500" />
                      </Button>
                      {/* `asChild` truyền kiểu dáng của Button xuống thẻ <a>.
                          Radix Slot yêu cầu ĐÚNG MỘT phần tử con — đừng thêm
                          phần tử nào khác vào bên trong Button này.

                          rel="noopener" là bắt buộc khi có target="_blank":
                          thiếu nó, trang mới đọc được `window.opener` và có thể
                          điều hướng tab quản trị sang nơi khác. */}
                      <Button variant="ghost" size="icon" title="Mở tệp gốc" asChild>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          <ExternalLink className="h-4 w-4 text-emerald-600" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xóa"
                        disabled={deletingId === doc.docId}
                        onClick={() => handleDelete(doc)}
                      >
                        {deletingId === doc.docId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Chưa có tài liệu chính sách nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ==================== FAQ (CHỈ ĐỌC) ==================== */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Câu hỏi thường gặp</h2>

        <div className="flex gap-3 rounded-md border bg-muted/40 p-3 text-sm">
          <Info className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />
          <p className="text-muted-foreground">
            Danh sách này được quản lý trong mã nguồn
            (<code className="text-xs">src/api/faqs/faqs.data.js</code>) nên chỉ
            xem được ở đây. Sửa nội dung bằng cách chỉnh tệp đó rồi triển khai
            lại — nhờ vậy mỗi lần đổi chính sách đều có commit kèm tác giả và
            thời điểm. Cần nội dung sửa được ngay mà không deploy thì dùng phần
            Tài liệu chính sách ở trên.
          </p>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead className="w-1/3">Câu hỏi</TableHead>
                <TableHead className="w-1/2">Trả lời</TableHead>
                <TableHead>Nhóm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading &&
                faqs.map((faq) => (
                  <TableRow key={faq.faqId}>
                    <TableCell>{faq.faqId}</TableCell>
                    <TableCell className="font-medium">{faq.question}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {stripHtml(faq.answer)}
                    </TableCell>
                    <TableCell>{faq.category || '—'}</TableCell>
                  </TableRow>
                ))}
              {!loading && faqs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Chưa có dữ liệu FAQ.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ==================== Hộp thoại: xác nhận trước khi tải lên ==================== */}
      <Dialog open={!!pendingFile} onOpenChange={(open) => !open && setPendingFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm tài liệu chính sách</DialogTitle>
            <DialogDescription>
              {pendingFile?.name} · {formatBytes(pendingFile?.size || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="doc-title">Tiêu đề hiển thị</Label>
              <Input
                id="doc-title"
                value={pendingTitle}
                onChange={(e) => setPendingTitle(e.target.value)}
                placeholder="Ví dụ: Quy chế hoàn tiền 2026"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doc-category">Nhóm</Label>
              <Input
                id="doc-category"
                value={pendingCategory}
                onChange={(e) => setPendingCategory(e.target.value)}
                placeholder="Chính sách"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Sau khi bấm Tải lên, hệ thống bóc nội dung tệp và nạp vào tri thức
              chatbot. Việc này có thể mất vài giây với tài liệu nhiều trang.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingFile(null)}>
              Hủy
            </Button>
            <Button onClick={handleConfirmUpload} disabled={!pendingTitle.trim()}>
              Tải lên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Hộp thoại: xem nội dung đã bóc ==================== */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
            <DialogDescription>
              Đây là phần văn bản mà chatbot thực sự đọc được từ tệp — không phải
              bản trình bày của tệp gốc.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto rounded-md border bg-muted/30 p-4">
            {viewLoading ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            ) : (
              // `whitespace-pre-wrap` giữ nguyên xuống dòng của văn bản gốc.
              // Dùng thẻ <pre>/text thuần chứ TUYỆT ĐỐI không
              // dangerouslySetInnerHTML: nội dung này đến từ một tệp tải lên.
              <pre className="whitespace-pre-wrap break-words text-sm font-sans">
                {viewText || 'Không có nội dung để hiển thị.'}
              </pre>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaqsManagement;
