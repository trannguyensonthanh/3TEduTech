// src/pages/instructor/components/ImportMediaPreview.tsx
//
/* ============================================================================
   [THÊM 20/08/2026] XEM TRƯỚC VIDEO VÀ ẢNH TRONG BẢN NHÁP

   ── VẤN ĐỀ ĐANG GIẢI ─────────────────────────────────────────────────────

   Màn hình duyệt bản nháp là chốt chặn cuối cùng trước khi bất cứ thứ gì được
   ghi vào cơ sở dữ liệu. Nhưng cho tới nay nó chỉ hiện TÊN TỆP: giảng viên
   duyệt một khóa học mà chưa từng nhìn thấy nội dung của nó. Đóng gói nhầm bản
   nháp chưa quay xong, hay một video của khóa học khác, thì phải tạo khóa học
   xong, mở trang học, xem từng bài mới phát hiện — lúc đó sửa tốn công gấp bội.

   ── VÌ SAO CẦN MỘT COMPONENT RIÊNG ───────────────────────────────────────

   Tệp chưa lên Cloudinary nên không có URL công khai. Nó nằm trên đĩa máy chủ,
   trong thư mục tạm của phiên nhập, và chỉ đọc được qua một tuyến có xác thực.
   Toàn bộ phần xoay xở với chuyện đó gói gọn ở đây, để danh sách bài học bên
   ngoài chỉ cần một nút bấm.
============================================================================ */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Eye, Loader2 } from 'lucide-react';
import { buildPreviewUrl } from '@/services/import.service';

interface Props {
  jobId: string;
  /** Đường dẫn tương đối trong tệp ZIP — khóa đối chiếu với bản nháp máy chủ. */
  sourcePath: string;
  /** Tên hiển thị trên tiêu đề hộp thoại. */
  title: string;
  kind: 'video' | 'image';
  /** Nút nhỏ gọn để nhét vào một dòng danh sách. */
  compact?: boolean;
}

const ImportMediaPreview: React.FC<Props> = ({
  jobId,
  sourcePath,
  title,
  kind,
  compact = true,
}) => {
  const [open, setOpen] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangTai, setDangTai] = useState(true);

  /* Chỉ dựng URL khi hộp thoại MỞ.
     Dựng sẵn từ lúc render danh sách nghĩa là mỗi bài video trong khóa học đều
     có một thẻ <video> trỏ tới máy chủ ngay khi trang hiện ra — trình duyệt sẽ
     tự tải phần đầu của TỪNG tệp để lấy metadata, và một khóa học 30 video sẽ
     nã 30 yêu cầu vào thư mục tạm chỉ để hiển thị một danh sách chữ. */
  const url = open ? buildPreviewUrl(jobId, sourcePath) : null;

  const moLai = () => {
    setLoi(null);
    setDangTai(true);
    setOpen(true);
  };

  return (
    <>
      <Button
        type='button'
        variant='ghost'
        size={compact ? 'sm' : 'default'}
        onClick={moLai}
        className={compact ? 'h-7 gap-1.5 px-2 text-xs' : 'gap-2'}
      >
        <Eye className='h-3.5 w-3.5' aria-hidden='true' />
        Xem trước
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle className='pr-8 text-base'>{title}</DialogTitle>
            <DialogDescription className='truncate font-mono text-xs'>
              {sourcePath}
            </DialogDescription>
          </DialogHeader>

          <div className='relative overflow-hidden rounded-lg border border-border bg-muted'>
            {dangTai && !loi && (
              <div className='absolute inset-0 z-10 flex items-center justify-center bg-muted'>
                <Loader2
                  className='h-6 w-6 animate-spin text-muted-foreground'
                  aria-hidden='true'
                />
              </div>
            )}

            {loi ? (
              <div className='flex flex-col items-center gap-2 p-8 text-center'>
                <AlertTriangle
                  className='h-7 w-7 text-warning'
                  aria-hidden='true'
                />
                <p className='text-sm text-muted-foreground'>{loi}</p>
              </div>
            ) : kind === 'video' ? (
              /* `preload="metadata"` chứ không phải "auto": chỉ tải phần đầu đủ
                 để biết thời lượng và vẽ thanh tua. Với video bài giảng vài
                 trăm MB, "auto" nghĩa là tải trọn tệp ngay khi mở hộp thoại. */
              <video
                key={url || ''}
                src={url || undefined}
                controls
                preload='metadata'
                className='max-h-[65vh] w-full bg-black'
                onLoadedMetadata={() => setDangTai(false)}
                onError={() =>
                  setLoi(
                    'Không phát được video này. Tệp có thể dùng định dạng trình duyệt ' +
                      'không hỗ trợ (MKV, AVI, WMV), hoặc bản nháp đã quá hạn và bị dọn ' +
                      'khỏi máy chủ. Video vẫn sẽ được tải lên bình thường khi bạn tạo ' +
                      'khóa học.'
                  )
                }
              >
                Trình duyệt của bạn không hỗ trợ phát video.
              </video>
            ) : (
              <img
                key={url || ''}
                src={url || undefined}
                alt={title}
                className='mx-auto max-h-[65vh] w-auto object-contain'
                onLoad={() => setDangTai(false)}
                onError={() =>
                  setLoi('Không mở được ảnh này. Bản nháp có thể đã quá hạn.')
                }
              />
            )}
          </div>

          {kind === 'video' && !loi && (
            <p className='text-xs text-muted-foreground'>
              Video đang phát trực tiếp từ tệp nén bạn vừa tải lên, chưa qua xử
              lý. Chất lượng sau khi tạo khóa học có thể khác đôi chút.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportMediaPreview;
