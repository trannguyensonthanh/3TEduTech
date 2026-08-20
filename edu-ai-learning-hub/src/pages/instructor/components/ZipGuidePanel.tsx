/* ============================================================================
 * ZipGuidePanel.tsx
 * [THÊM 18/08/2026]
 *
 * Hướng dẫn chuẩn bị tệp ZIP, đặt NGAY TRONG trang nhập khóa học.
 *
 * ----------------------------------------------------------------------------
 * ★ VÌ SAO ĐẶT Ở ĐÂY CHỨ KHÔNG PHẢI MỘT TRANG TÀI LIỆU RIÊNG
 *
 * Không ai đi đọc tài liệu trước khi bấm nút. Người ta bấm nút, gặp lỗi, rồi
 * mới đi tìm tài liệu — và lúc đó đã mất mười lăm phút tải một tệp 1.6GB.
 * Hướng dẫn phải nằm đúng chỗ và đúng lúc người ta cần nó.
 *
 * Mặc định thu gọn để không lấn chỗ khung kéo–thả. Giảng viên đã quen việc thì
 * lướt qua; người làm lần đầu mở ra đọc.
 * ========================================================================== */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  FolderTree,
  Youtube,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ImportLimits } from '@/services/import.service';

interface Props {
  limits: ImportLimits;
  /** Mở sẵn khi giảng viên vừa gặp lỗi tệp quá lớn. */
  defaultOpen?: boolean;
}

/* Lệnh PowerShell tạo một bản sao "nhẹ" của thư mục khóa học: giữ nguyên cây
   thư mục và mọi tài liệu, nhưng thay mỗi tệp video bằng một tệp RỖNG cùng tên.

   ★ Vì sao cần tệp rỗng thay vì xóa hẳn video: hệ thống dựng danh sách bài học
   TỪ TÊN TỆP. Xóa hẳn video là mất luôn bài học đó khỏi cấu trúc. Giữ lại tệp
   rỗng thì bài học vẫn còn, chỉ là chờ gắn video ở bước cuối.

   Dùng `-CompressionLevel Optimal` mặc định; không cần chỉnh vì tài liệu đã nhẹ. */
const LENH_POWERSHELL = `# Đổi 3 đường dẫn dưới cho đúng máy bạn, rồi dán cả khối vào PowerShell
$goc  = "D:\\KhoaHoc"           # thư mục khóa học gốc (có cả video)
$nhe  = "D:\\KhoaHoc-nhe"       # thư mục tạm sẽ được tạo ra
$zip  = "D:\\khoa-hoc.zip"      # tệp ZIP kết quả

$dinhDangVideo = '\\.(mp4|m4v|mov|mkv|webm|avi|wmv|flv)$'
if (Test-Path $nhe) { Remove-Item $nhe -Recurse -Force }

Get-ChildItem $goc -Recurse -File | ForEach-Object {
  $duongDanCon = $_.FullName.Substring($goc.Length + 1)
  $dich = Join-Path $nhe $duongDanCon
  New-Item -ItemType Directory -Force -Path (Split-Path $dich) | Out-Null
  if ($_.Name -match $dinhDangVideo) {
    New-Item -ItemType File -Force -Path $dich | Out-Null   # tệp rỗng, giữ tên
  } else {
    Copy-Item $_.FullName $dich -Force
  }
}

Compress-Archive -Path "$nhe\\*" -DestinationPath $zip -Force
Write-Host "Xong! Tệp ZIP:" $zip "-" ([math]::Round((Get-Item $zip).Length/1MB,1)) "MB"`;

const ZipGuidePanel: React.FC<Props> = ({ limits, defaultOpen = false }) => {
  const [moRong, setMoRong] = useState(defaultOpen);
  const [daChep, setDaChep] = useState(false);

  /* [SỬA 19/08/2026] `useState(defaultOpen)` CHỈ đọc giá trị một lần.

     ★ Lỗi cũ: trang cha truyền `defaultOpen={Boolean(loadError)}`, mà lỗi "tệp
     quá lớn" chỉ xảy ra SAU khi trang đã hiển thị — lúc giảng viên chọn tệp.
     Giá trị khởi tạo của `useState` đã được chốt từ lần render đầu (khi chưa có
     lỗi), nên bảng hướng dẫn KHÔNG hề mở ra. Đúng khoảnh khắc người dùng cần
     đọc nó nhất thì nó vẫn đóng.

     `useEffect` theo dõi `defaultOpen` sửa đúng chỗ đó. Chỉ MỞ, không bao giờ
     tự đóng: nếu người dùng đã chủ động thu gọn thì đừng giật nó mở lại. */
  useEffect(() => {
    if (defaultOpen) setMoRong(true);
  }, [defaultOpen]);

  const chepLenh = async () => {
    try {
      await navigator.clipboard.writeText(LENH_POWERSHELL);
      setDaChep(true);
      toast.success('Đã chép lệnh. Dán vào PowerShell và sửa 3 đường dẫn đầu.');
      setTimeout(() => setDaChep(false), 2500);
    } catch {
      /* `navigator.clipboard` cần ngữ cảnh bảo mật (HTTPS hoặc localhost).
         Trên HTTP qua IP nó không tồn tại — báo rõ thay vì im lặng không làm gì. */
      toast.error('Trình duyệt chặn sao chép. Hãy bôi đen đoạn lệnh rồi Ctrl+C.');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setMoRong((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
            <FolderTree className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold">Chuẩn bị tệp ZIP thế nào?</p>
            <p className="text-xs text-muted-foreground">
              Đọc một lần, dùng mãi — mất khoảng 2 phút
            </p>
          </div>
        </div>
        {moRong ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {moRong && (
        <div className="space-y-6 border-t border-border px-5 py-5 text-sm">
          {/* ---------- Ý chính ---------- */}
          <div className="flex gap-3 rounded-xl border border-border bg-accent p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                Tệp ZIP chỉ chứa tài liệu và phụ đề — không chứa video.
              </p>
              <p className="text-muted-foreground">
                Video được gắn ở bước cuối, đi thẳng từ máy bạn lên kho lưu trữ
                mà không qua máy chủ. Nhờ vậy tệp ZIP chỉ còn vài MB thay vì vài
                GB, tải lên trong vài giây, và bạn không phải chờ lại từ đầu mỗi
                khi mạng chập chờn.
              </p>
            </div>
          </div>

          {/* ---------- Cấu trúc thư mục ---------- */}
          <section className="space-y-2">
            <h4 className="font-semibold">1. Sắp thư mục theo chương</h4>
            <p className="text-muted-foreground">
              Mỗi thư mục con là một <strong>chương</strong>, mỗi tệp bên trong
              là một <strong>bài học</strong>. Đánh số ở đầu tên để giữ đúng thứ
              tự.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
{`KhoaHoc-JavaScript/
├─ 01 - Nhập môn/
│  ├─ 01-gioi-thieu.mp4          ← thành bài học VIDEO
│  ├─ 01-gioi-thieu.srt          ← phụ đề, tự ghép vào bài cùng tên
│  ├─ 01-gioi-thieu.txt          ← GỘP vào bài trên làm nội dung kèm theo
│  └─ 02-cai-dat-moi-truong.pdf  ← thành bài học TÀI LIỆU riêng
├─ 02 - Biến và kiểu dữ liệu/
│  ├─ 01-khai-bao-bien.mp4
│  └─ 02-bai-tap.docx
└─ _khoa-hoc.md                  ← mô tả khóa học (tùy chọn)`}
            </pre>
            <p className="text-xs text-muted-foreground">
              <strong>Quy tắc trùng tên:</strong> tệp nào cùng tên với một
              video (chỉ khác phần đuôi) thì thuộc về chính bài video đó —{' '}
              <code>.srt</code> thành phụ đề, tài liệu thành nội dung kèm theo.
              Nhờ vậy một bài giảng có cả video lẫn ghi chú vẫn chỉ ra{' '}
              <strong>một bài học</strong>, không bị tách đôi.
              <br />
              Tệp bắt đầu bằng dấu gạch dưới <code>_</code> được hiểu là mô tả,
              không thành bài học.
            </p>
          </section>

          {/* ---------- Lệnh tạo ZIP nhẹ ---------- */}
          <section className="space-y-2">
            <h4 className="font-semibold">
              2. Tạo tệp ZIP nhẹ — dán một lệnh, xong
            </h4>
            <p className="text-muted-foreground">
              Lệnh này chép toàn bộ thư mục nhưng <strong>thay mỗi video bằng
              một tệp rỗng cùng tên</strong>, rồi nén lại. Cấu trúc bài học giữ
              nguyên, dung lượng còn vài MB.
            </p>
            <div className="relative">
              <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-muted p-4 pr-24 text-xs leading-relaxed text-foreground">
                {LENH_POWERSHELL}
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute right-3 top-3"
                onClick={chepLenh}
              >
                {daChep ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" /> Đã chép
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Chép lệnh
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mở PowerShell: bấm <kbd>Windows</kbd> + <kbd>X</kbd> rồi chọn
              Terminal / PowerShell. Nhớ sửa 3 đường dẫn ở đầu lệnh cho đúng máy
              bạn.
            </p>
            <p className="text-xs text-muted-foreground">
              Không muốn dùng lệnh? Cũng được: cứ nén cả thư mục như bình
              thường, miễn là tệp ZIP dưới {limits.maxZipMb}MB. Hệ thống bỏ qua
              phần nội dung video và chỉ đọc tên chúng.
            </p>
          </section>

          {/* ---------- Gắn video ---------- */}
          <section className="space-y-2">
            <h4 className="font-semibold">3. Gắn video ở bước cuối</h4>
            <p className="text-muted-foreground">
              Sau khi duyệt và tạo khóa học, bạn chọn{' '}
              <strong>tất cả video một lượt</strong> — hệ thống tự ghép vào đúng
              bài theo tên tệp. Với mỗi bài có hai lựa chọn:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <p className="font-medium">Tải lên hệ thống</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tối đa <strong>{limits.maxVideoUploadMb}MB</strong> mỗi tệp.
                  Video nằm trong hệ thống, phát bằng đường dẫn có bảo vệ — học
                  viên không tải về được.
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="flex items-center gap-1.5 font-medium">
                  <Youtube className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  Dán link YouTube
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Không giới hạn dung lượng. Nên đặt video ở chế độ{' '}
                  <em>Không công khai (Unlisted)</em>: không ai tìm thấy trên
                  YouTube, chỉ người có link mới xem được.
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Bài giảng quay màn hình thường nhẹ, tải thẳng lên là gọn nhất. Bài
              quay hình 1080p dài 30 phút thường vượt {limits.maxVideoUploadMb}MB
              — dùng YouTube cho những bài đó.
            </p>
          </section>

          {/* ---------- Lưu ý cuối ---------- */}
          <section className="space-y-1.5 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Vài điều nên biết</p>
            <p>
              • Không có gì được lưu vào hệ thống cho tới khi bạn bấm đồng ý ở
              bước duyệt — và video chỉ được tải lên khi bạn bấm xác nhận ở bước
              cuối.
            </p>
            <p>
              • Khóa học tạo ra ở trạng thái <strong>nháp</strong>. Bạn xem lại,
              sửa, rồi mới gửi duyệt.
            </p>
            <p>
              • Tên tệp có dấu tiếng Việt vẫn dùng được. Nếu hiện ra lạ, hãy nén
              lại bằng công cụ nén sẵn có của Windows.
            </p>
          </section>
        </div>
      )}
    </div>
  );
};

export default ZipGuidePanel;
