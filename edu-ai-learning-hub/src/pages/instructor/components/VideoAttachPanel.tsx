/* ============================================================================
 * VideoAttachPanel.tsx
 * [THÊM 18/08/2026]
 *
 * Bước 4 của luồng nhập khóa học: gắn nguồn video cho từng bài.
 *
 * ----------------------------------------------------------------------------
 * ★ NGUYÊN TẮC SỐ MỘT: KHÔNG TẢI GÌ LÊN TRƯỚC KHI BẤM XÁC NHẬN
 *
 * Tệp mà giảng viên chọn được giữ nguyên trong bộ nhớ trình duyệt (đối tượng
 * `File`, chỉ là con trỏ tới tệp trên đĩa — không tốn RAM theo dung lượng tệp).
 * Không một byte nào rời máy cho tới khi bấm "Xác nhận & tải lên".
 *
 * Vì sao điều này quan trọng: nếu tải ngay lúc chọn, giảng viên đổi ý hoặc
 * đóng tab là đã có một đống tệp nằm lại trên Cloudinary — tốn credit của gói
 * miễn phí (25 credit/tháng, mỗi GB lưu trữ ăn 1 credit) mà không bài học nào
 * trỏ tới. Rác kiểu đó không ai đi dọn, vì không ai biết nó tồn tại.
 *
 * ----------------------------------------------------------------------------
 * ★ HAI CÁCH GẮN VIDEO, CHỌN THEO DUNG LƯỢNG
 *
 *   Tải lên Cloudinary  — video ≤ 100MB. Đi THẲNG từ trình duyệt lên
 *                         Cloudinary, không qua máy chủ (xem
 *                         `uploadLessonVideoDirect`). Video nằm trong hệ thống,
 *                         phát bằng đường dẫn có chữ ký.
 *
 *   Link YouTube        — video bất kỳ dung lượng nào. Không tốn credit, không
 *                         giới hạn, YouTube lo cả việc chuyển mã và phát nhiều
 *                         độ phân giải.
 *
 * 100MB không phải con số ta tự đặt — đó là trần cứng của gói Cloudinary miễn
 * phí. Giao diện đọc nó từ `GET /v1/imports/limits` chứ không ghi cứng.
 *
 * ----------------------------------------------------------------------------
 * ★ KHỚP TÊN TỰ ĐỘNG
 *
 * Giảng viên chọn MỘT LƯỢT tất cả video, hệ thống tự ghép vào đúng bài dựa trên
 * `videoFileName` mà bản nháp đã ghi lại từ tệp ZIP. Không phải kéo thả từng
 * bài một — với khóa 40 bài thì đó là khác biệt giữa "làm được" và "bỏ cuộc".
 * ========================================================================== */

import React, { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  AlertTriangle,
  Youtube,
  UploadCloud,
  FileVideo,
  Loader2,
  X,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

import type { LessonNeedingVideo, ImportLimits } from '@/services/import.service';
import {
  uploadLessonVideoDirect,
  setLessonYoutubeVideo,
} from '@/services/lesson.service';

type NguonVideo = 'NONE' | 'FILE' | 'YOUTUBE';
type TrangThai = 'IDLE' | 'UPLOADING' | 'DONE' | 'FAILED';

interface MucGan {
  lesson: LessonNeedingVideo;
  nguon: NguonVideo;
  /** Tệp đang chờ — CHƯA tải lên. Xem nguyên tắc số một ở đầu tệp. */
  file: File | null;
  youtubeUrl: string;
  trangThai: TrangThai;
  phanTram: number;
  loi: string | null;
}

interface Props {
  /* Không có `courseId` ở đây — CÓ CHỦ Ý.
     Bản đầu tôi khai báo nó rồi không dùng tới lần nào: mọi lời gọi đều theo
     `lessonId`, và máy chủ tự tra ra khóa học từ bài học. Một prop thừa trông
     như thể component cần biết thứ nó không cần, và người sửa sau sẽ mất công
     đi tìm chỗ dùng. */
  lessons: LessonNeedingVideo[];
  limits: ImportLimits;
  /** Gọi khi giảng viên bấm "Hoàn tất" — kể cả khi còn bài chưa gắn. */
  onFinish: () => void;
}

const dinhDangDungLuong = (bytes: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / 1024 / 1024;
  return mb < 1024 ? `${mb.toFixed(1)} MB` : `${(mb / 1024).toFixed(2)} GB`;
};

/** Nhận diện link YouTube ở mọi dạng thường gặp — chỉ để phản hồi nhanh cho
 *  người dùng. Việc lấy videoId thật do máy chủ làm (`extractYoutubeId`). */
const LA_LINK_YOUTUBE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)[\w-]{6,}/i;

const VideoAttachPanel: React.FC<Props> = ({
  lessons,
  limits,
  onFinish,
}) => {
  const [items, setItems] = useState<MucGan[]>(() =>
    lessons.map((lesson) => ({
      lesson,
      nguon: 'NONE',
      file: null,
      youtubeUrl: '',
      trangThai: 'IDLE',
      phanTram: 0,
      loi: null,
    }))
  );
  const [dangTaiLen, setDangTaiLen] = useState(false);
  const inputHangLoat = useRef<HTMLInputElement>(null);

  const tranByte = limits.maxVideoUploadMb * 1024 * 1024;

  const capNhat = (lessonId: number, thayDoi: Partial<MucGan>) =>
    setItems((cu) =>
      cu.map((m) => (m.lesson.lessonId === lessonId ? { ...m, ...thayDoi } : m))
    );

  /* ---------------------------------------------------------------------
   * Chọn một lượt nhiều tệp → tự khớp theo tên
   * ------------------------------------------------------------------- */
  const chonHangLoat = (danhSach: FileList | null) => {
    if (inputHangLoat.current) inputHangLoat.current.value = '';
    if (!danhSach || danhSach.length === 0) return;

    /* So khớp KHÔNG phân biệt hoa/thường: ổ Windows (NTFS) không phân biệt,
       nên tên trong ZIP và tên tệp người dùng chọn có thể khác nhau về hoa
       thường mà vẫn là cùng một tệp. */
    const theoTen = new Map<string, File>();
    Array.from(danhSach).forEach((f) => theoTen.set(f.name.toLowerCase(), f));

    let khop = 0;
    setItems((cu) =>
      cu.map((m) => {
        // Đã gắn xong thì không đụng vào nữa.
        if (m.trangThai === 'DONE') return m;
        const ten = m.lesson.videoFileName?.toLowerCase();
        const f = ten ? theoTen.get(ten) : undefined;
        if (!f) return m;
        khop += 1;
        return { ...m, nguon: 'FILE', file: f, loi: null, trangThai: 'IDLE' };
      })
    );

    const thua = danhSach.length - khop;
    if (khop === 0) {
      toast.error(
        'Không tệp nào khớp tên với bài học. Tên tệp phải trùng với tên trong tệp ZIP.'
      );
    } else {
      toast.success(
        `Đã khớp ${khop}/${danhSach.length} tệp.` +
          (thua > 0 ? ` ${thua} tệp không tìm thấy bài tương ứng.` : '')
      );
    }
  };

  /* ---------------------------------------------------------------------
   * Tải lên THẬT — chỉ chạy khi bấm xác nhận
   * ------------------------------------------------------------------- */
  const xacNhanVaTaiLen = async () => {
    const canXuLy = items.filter(
      (m) =>
        m.trangThai !== 'DONE' &&
        ((m.nguon === 'FILE' && m.file) ||
          (m.nguon === 'YOUTUBE' && m.youtubeUrl.trim()))
    );

    if (canXuLy.length === 0) {
      toast.error('Chưa có bài nào được gắn video.');
      return;
    }

    /* [SỬA 19/08/2026] Tệp vượt trần chỉ BỊ BỎ QUA, không chặn cả loạt.

       ★ Bản đầu của tôi `return` ngay khi có bất kỳ tệp nào quá lớn — nghĩa là
       một tệp 150MB trong số 20 tệp hợp lệ khiến giảng viên không tải được gì
       cả. Với khóa 40 bài thì đó là bế tắc: phải tự tìm ra tệp nào có lỗi,
       trong khi họ đã chọn tất cả một lượt.

       Nay tải hết những tệp hợp lệ, và nêu ĐÍCH DANH tệp bị bỏ qua để họ đổi
       sang YouTube cho riêng những bài đó. */
    const quaLon = canXuLy.filter(
      (m) => m.nguon === 'FILE' && m.file && m.file.size > tranByte
    );
    const seXuLy = canXuLy.filter((m) => !quaLon.includes(m));

    if (quaLon.length > 0) {
      quaLon.forEach((m) =>
        capNhat(m.lesson.lessonId, {
          trangThai: 'FAILED',
          loi:
            `Tệp ${(m.file!.size / 1024 / 1024).toFixed(0)}MB vượt quá trần ` +
            `${limits.maxVideoUploadMb}MB. Hãy dùng link YouTube cho bài này, ` +
            'hoặc nén video xuống nhẹ hơn.',
        })
      );
      toast.error(
        `Bỏ qua ${quaLon.length} tệp vượt quá ${limits.maxVideoUploadMb}MB. ` +
          'Lý do hiện ngay dưới từng bài.'
      );
    }

    if (seXuLy.length === 0) {
      return; // Không còn gì hợp lệ để tải.
    }

    setDangTaiLen(true);
    let soThanhCong = 0;
    let soLoi = quaLon.length;

    /* TUẦN TỰ, không song song.
       Tải nhiều video cùng lúc chia nhau băng thông tải lên vốn đã hẹp của
       mạng gia đình, khiến TẤT CẢ cùng chậm và không cái nào xong sớm. Tuần tự
       thì mỗi bài xong dứt điểm một bài, và thanh tiến độ nói đúng sự thật. */
    for (const muc of seXuLy) {
      const { lessonId } = muc.lesson;
      capNhat(lessonId, { trangThai: 'UPLOADING', phanTram: 0, loi: null });

      try {
        if (muc.nguon === 'YOUTUBE') {
          await setLessonYoutubeVideo(lessonId, muc.youtubeUrl);
          capNhat(lessonId, { trangThai: 'DONE', phanTram: 100 });
          soThanhCong += 1;
        } else if (muc.file) {
          await uploadLessonVideoDirect(lessonId, muc.file, (p) =>
            capNhat(lessonId, { phanTram: p })
          );
          capNhat(lessonId, { trangThai: 'DONE', phanTram: 100 });
          soThanhCong += 1;
        }
      } catch (error) {
        /* Một bài hỏng KHÔNG dừng cả loạt: giảng viên đã đợi lâu, dừng ở bài
           thứ 3 trong 40 bài nghĩa là 37 bài còn lại phải làm lại từ đầu. Ghi
           lỗi vào đúng dòng đó rồi đi tiếp; cuối cùng họ thử lại riêng bài lỗi. */
        capNhat(lessonId, {
          trangThai: 'FAILED',
          loi: (error as Error)?.message || 'Không rõ nguyên nhân',
        });
        soLoi += 1;
      }
    }

    setDangTaiLen(false);

    /* [SỬA 19/08/2026] Đếm kết quả bằng biến cục bộ, KHÔNG đọc `items`.
       ★ Lỗi cũ: `items.filter(m => m.trangThai === 'FAILED')` ở đây đọc giá trị
       `items` bị ĐÓNG BĂNG trong closure từ lần render tạo ra hàm này — tức là
       trạng thái TRƯỚC khi tải. Mọi mục đều còn 'IDLE', nên số lỗi luôn bằng 0
       và thông báo luôn là "Đã gắn video xong" kể cả khi cả 40 bài đều thất
       bại. Đây đúng là loại lỗi làm người dùng tin rằng mọi thứ ổn. */
    if (soLoi === 0) {
      toast.success(`Đã gắn video cho ${soThanhCong} bài.`);
    } else {
      toast.error(
        `${soThanhCong} bài thành công, ${soLoi} bài thất bại. ` +
          'Lý do hiện ngay dưới từng bài — sửa rồi bấm xác nhận lại.'
      );
    }
  };

  /* ------------------------------- Thống kê ------------------------------ */
  const thongKe = useMemo(() => {
    const xong = items.filter((m) => m.trangThai === 'DONE').length;
    const daChon = items.filter(
      (m) =>
        m.trangThai !== 'DONE' &&
        ((m.nguon === 'FILE' && m.file) ||
          (m.nguon === 'YOUTUBE' && m.youtubeUrl.trim()))
    ).length;
    const vuotTran = items.filter(
      (m) => m.nguon === 'FILE' && m.file && m.file.size > tranByte
    ).length;
    return { xong, daChon, vuotTran, tong: items.length };
  }, [items, tranByte]);

  return (
    <div className="space-y-5">
      {/* ---------------- Đầu trang ---------------- */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Gắn video cho bài học</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Khóa học đã được tạo. Còn {thongKe.tong} bài cần nguồn video —{' '}
              <strong>{thongKe.xong}</strong> đã xong.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={inputHangLoat}
              type="file"
              multiple
              accept={limits.videoExtensions.join(',')}
              className="hidden"
              onChange={(e) => chonHangLoat(e.target.files)}
            />
            <Button
              variant="outline"
              disabled={dangTaiLen}
              onClick={() => inputHangLoat.current?.click()}
            >
              <FileVideo className="mr-2 h-4 w-4" />
              Chọn tất cả video một lượt
            </Button>
          </div>
        </div>

        {/* Giải thích ngắn — đặt ngay đây vì đây là lúc giảng viên cần biết */}
        <div className="mt-4 flex gap-3 rounded-lg bg-muted/50 p-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1 text-muted-foreground">
            <p>
              <strong className="text-foreground">Tải lên</strong> dùng cho video
              tối đa {limits.maxVideoUploadMb}MB — video nằm trong hệ thống, phát
              bằng đường dẫn có bảo vệ.
            </p>
            <p>
              <strong className="text-foreground">Link YouTube</strong> dùng cho
              video nặng hơn — không giới hạn dung lượng. Nên đặt video ở chế độ{' '}
              <em>Không công khai (Unlisted)</em> để chỉ người có link xem được.
            </p>
            <p className="text-xs">
              Bấm <strong>Chọn tất cả video một lượt</strong> rồi hệ thống tự
              ghép vào đúng bài theo tên tệp. Không có gì được tải lên cho tới
              khi bạn bấm <strong>Xác nhận &amp; tải lên</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* ---------------- Danh sách bài ---------------- */}
      <div className="space-y-3">
        {items.map((m) => {
          const vuotTran = Boolean(
            m.nguon === 'FILE' && m.file && m.file.size > tranByte
          );
          const goiYYoutube = Boolean(
            m.lesson.sizeBytes && m.lesson.sizeBytes > tranByte
          );

          return (
            <div
              key={m.lesson.lessonId}
              className={`rounded-xl border p-4 transition-colors ${
                m.trangThai === 'DONE'
                  ? 'border-border bg-success-soft'
                  : m.trangThai === 'FAILED'
                    ? 'border-border bg-danger-soft'
                    : 'border-border bg-card'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {m.trangThai === 'DONE' && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    )}
                    <p className="truncate font-semibold">{m.lesson.lessonName}</p>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {m.lesson.videoFileName || m.lesson.sourcePath} ·{' '}
                    {dinhDangDungLuong(m.lesson.sizeBytes)}
                    {m.lesson.hasSubtitle && ' · có phụ đề'}
                  </p>
                </div>

                {m.trangThai !== 'DONE' && (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant={m.nguon === 'FILE' ? 'default' : 'outline'}
                      disabled={dangTaiLen}
                      onClick={() => capNhat(m.lesson.lessonId, { nguon: 'FILE' })}
                    >
                      <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                      Tải lên
                    </Button>
                    <Button
                      size="sm"
                      variant={m.nguon === 'YOUTUBE' ? 'default' : 'outline'}
                      disabled={dangTaiLen}
                      onClick={() =>
                        capNhat(m.lesson.lessonId, { nguon: 'YOUTUBE' })
                      }
                    >
                      <Youtube className="mr-1.5 h-3.5 w-3.5" />
                      YouTube
                    </Button>
                  </div>
                )}
              </div>

              {/* Gợi ý khi video gốc đã biết là quá nặng */}
              {m.nguon === 'NONE' && goiYYoutube && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  Video này nặng hơn {limits.maxVideoUploadMb}MB — nên dùng link
                  YouTube.
                </p>
              )}

              {/* --- Chế độ tải tệp --- */}
              {m.nguon === 'FILE' && m.trangThai !== 'DONE' && (
                <div className="mt-3 space-y-2">
                  <input
                    type="file"
                    accept={limits.videoExtensions.join(',')}
                    disabled={dangTaiLen}
                    className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
                    onChange={(e) =>
                      capNhat(m.lesson.lessonId, {
                        file: e.target.files?.[0] || null,
                        loi: null,
                      })
                    }
                  />
                  {m.file && (
                    <p
                      className={`text-xs ${vuotTran ? 'font-medium text-danger' : 'text-muted-foreground'}`}
                    >
                      {m.file.name} · {dinhDangDungLuong(m.file.size)}
                      {vuotTran &&
                        ` — vượt quá ${limits.maxVideoUploadMb}MB, hãy dùng link YouTube`}
                    </p>
                  )}
                </div>
              )}

              {/* --- Chế độ YouTube --- */}
              {m.nguon === 'YOUTUBE' && m.trangThai !== 'DONE' && (
                <div className="mt-3 space-y-1">
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={m.youtubeUrl}
                    disabled={dangTaiLen}
                    onChange={(e) =>
                      capNhat(m.lesson.lessonId, {
                        youtubeUrl: e.target.value,
                        loi: null,
                      })
                    }
                  />
                  {m.youtubeUrl.trim() &&
                    !LA_LINK_YOUTUBE.test(m.youtubeUrl.trim()) && (
                      <p className="text-xs text-warning">
                        Trông không giống link YouTube. Máy chủ sẽ kiểm tra lại
                        khi bạn xác nhận.
                      </p>
                    )}
                </div>
              )}

              {/* --- Tiến độ --- */}
              {m.trangThai === 'UPLOADING' && (
                <div className="mt-3 space-y-1">
                  <Progress value={m.phanTram} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {m.nguon === 'YOUTUBE'
                      ? 'Đang lấy thông tin video...'
                      : `Đang tải lên ${m.phanTram}%`}
                  </p>
                </div>
              )}

              {m.trangThai === 'FAILED' && m.loi && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-danger">
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {m.loi}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ---------------- Thanh hành động ---------------- */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
        <p className="text-sm text-muted-foreground">
          {thongKe.xong}/{thongKe.tong} bài đã có video
          {thongKe.daChon > 0 && ` · ${thongKe.daChon} bài đang chờ xác nhận`}
          {thongKe.vuotTran > 0 && (
            <span className="ml-1 font-medium text-danger">
              · {thongKe.vuotTran} tệp vượt trần
            </span>
          )}
        </p>
        <div className="flex gap-2">
          {/* Cho phép hoàn tất kể cả khi còn bài chưa gắn: khóa học vẫn ở trạng
              thái NHÁP và giảng viên bổ sung video sau ở trang Sửa khóa học. */}
          <Button variant="outline" onClick={onFinish} disabled={dangTaiLen}>
            {thongKe.xong === thongKe.tong ? 'Hoàn tất' : 'Để sau'}
          </Button>
          <Button
            onClick={xacNhanVaTaiLen}
            /* [SỬA 19/08/2026] BỎ điều kiện `thongKe.vuotTran > 0`.
               Khóa nút vì một tệp quá lớn nghĩa là 20 tệp hợp lệ còn lại cũng
               không tải được, và giảng viên không có cách nào đi tiếp. Nay các
               tệp vượt trần bị đánh dấu lỗi riêng và bỏ qua, phần còn lại vẫn
               chạy — xem `xacNhanVaTaiLen`. */
            disabled={dangTaiLen || thongKe.daChon === 0}
          >
            {dangTaiLen ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải lên…
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Xác nhận &amp; tải lên ({thongKe.daChon})
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoAttachPanel;
