// src/pages/Certificates.tsx
//
// [VIẾT LẠI 17/08/2026 — LEVEL 2, mục 2.1 + 2.2]
//
/* ============================================================================
   BẢN CŨ LÀM GÌ SAI?

   Trang cũ suy ra chứng chỉ từ danh sách ghi danh (`completionDate != null`)
   rồi TỰ GHÉP mã ngay trên trình duyệt: `CERT-${courseId}-${accountId}`.
   Ba hệ quả:
     1. Mã không lưu ở đâu → không có gì để tra cứu, không xác minh được.
     2. Công thức lộ thiên → ai cũng tự chế ra một mã "hợp lệ".
     3. Nội dung chứng chỉ đọc từ dữ liệu HIỆN TẠI → giảng viên đổi tên khóa học
        là tấm chứng chỉ đã cấp cũng đổi theo. Giấy tờ đã cấp mà tự đổi nội dung
        thì không còn là giấy tờ.

   Bản mới đọc thẳng từ bảng Certificates: mã do server sinh ngẫu nhiên, ký bằng
   HMAC-SHA256, và mọi thông tin in trên chứng chỉ đều là ẢNH CHỤP tại thời
   điểm cấp (các cột *Snapshot) nên vĩnh viễn không đổi.
============================================================================ */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  AlertTriangle,
  Loader2,
  FileDown,
  Eye,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';

import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { CertificateDisplay } from '@/components/certificates/CertificateDisplay';
import { CertificatePDFDocument } from '@/components/certificates/CertificatePDFDocument';
import { HiddenQrCanvas } from '@/components/certificates/HiddenQrCanvas';
import {
  getMyCertificates,
  type Certificate,
} from '@/services/certificate.service';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

const CertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Certificate | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getMyCertificates()
      .then((res) => setCertificates(res.certificates || []))
      .catch((err) =>
        setError(
          (err as Error)?.message ||
            'Không tải được danh sách chứng chỉ. Vui lòng thử lại.'
        )
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Mã QR phải được vẽ lại mỗi khi đổi chứng chỉ đang xem. Xóa ảnh cũ ngay khi
  // mở tấm khác, nếu không PDF sẽ nhúng nhầm mã QR của chứng chỉ trước đó —
  // một lỗi rất khó phát hiện vì hai mã QR trông y hệt nhau bằng mắt thường.
  useEffect(() => {
    setQrDataUrl(null);
  }, [selected?.certificateCode]);

  const validCount = useMemo(
    () => certificates.filter((c) => c.isValid).length,
    [certificates]
  );

  /* ---------------------------- Trạng thái tải ---------------------------- */
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <Skeleton className="mb-3 h-9 w-64" />
          <Skeleton className="mb-10 h-5 w-96" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-56 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-danger" aria-hidden="true" />
          <h2 className="mb-2 text-xl font-semibold">
            Lỗi tải dữ liệu
          </h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={load} className="mt-6">
            Thử lại
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        {/* Tiêu đề */}
        <PageHeader
          className="mb-10"
          title="Chứng chỉ của tôi"
          description="Mỗi chứng chỉ có mã riêng và trang xác minh công khai — nhà tuyển dụng kiểm chứng được mà không cần tài khoản."
          actions={
            certificates.length > 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5">
                <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
                <span className="text-sm">
                  <strong className="tabular-nums">{validCount}</strong> chứng chỉ hợp lệ
                </span>
              </div>
            ) : undefined
          }
        />

        {/* Chưa có chứng chỉ nào */}
        {certificates.length === 0 ? (
          <Card className="border-dashed border-border shadow-none">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <GraduationCap className="mb-4 h-14 w-14 text-muted-foreground" aria-hidden="true" />
              <h3 className="mb-2 text-lg font-semibold">
                Bạn chưa có chứng chỉ nào
              </h3>
              <p className="mb-6 max-w-md text-sm text-muted-foreground">
                Chứng chỉ được cấp tự động ngay khi bạn hoàn thành 100% một khóa
                học. Không cần thao tác gì thêm.
              </p>
              <Link to="/my-courses">
                <Button>Tới khóa học của tôi</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <CertificateCard
                key={cert.certificateCode}
                cert={cert}
                onView={() => setSelected(cert)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Xem chi tiết */}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-w-[95vw] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" aria-hidden="true" />
              {selected?.courseNameSnapshot}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <>
              {/* Vẽ mã QR ra canvas ẩn để lấy ảnh nhúng vào PDF */}
              <HiddenQrCanvas
                value={selected.verifyUrl}
                onReady={setQrDataUrl}
              />

              <CertificateDisplay
                studentName={selected.studentNameSnapshot}
                courseName={selected.courseNameSnapshot}
                instructorName={selected.instructorNameSnapshot}
                completionDate={formatDate(
                  selected.completedAt || selected.issuedAt
                )}
                certificateCode={selected.certificateCode}
                verifyUrl={selected.verifyUrl}
                courseVersionNumber={selected.courseVersionNumber}
                totalLessons={selected.totalLessonsSnapshot}
                finalQuizAverage={selected.finalQuizAverage}
                categoryName={selected.categoryName}
                levelName={selected.levelName}
                isValid={selected.isValid}
              />

              <div className="flex justify-center pb-2">
                {/* PDFDownloadLink dựng file trong trình duyệt.
                    `key` gắn theo mã chứng chỉ + việc đã có QR hay chưa: nếu
                    không có key, React tái sử dụng instance cũ và người dùng
                    tải về đúng file PDF của tấm chứng chỉ vừa xem trước đó. */}
                <PDFDownloadLink
                  key={`${selected.certificateCode}-${qrDataUrl ? 'qr' : 'noqr'}`}
                  document={
                    <CertificatePDFDocument
                      studentName={selected.studentNameSnapshot}
                      courseName={selected.courseNameSnapshot}
                      instructorName={selected.instructorNameSnapshot}
                      completionDate={formatDate(
                        selected.completedAt || selected.issuedAt
                      )}
                      certificateCode={selected.certificateCode}
                      verifyUrl={selected.verifyUrl}
                      qrDataUrl={qrDataUrl}
                      courseVersionNumber={selected.courseVersionNumber}
                      totalLessons={selected.totalLessonsSnapshot}
                      finalQuizAverage={selected.finalQuizAverage}
                      categoryName={selected.categoryName}
                      levelName={selected.levelName}
                      isValid={selected.isValid}
                    />
                  }
                  fileName={`ChungChi-${selected.certificateCode}.pdf`}
                >
                  {({ loading: pdfLoading }) => (
                    <Button variant="secondary" size="lg" disabled={pdfLoading}>
                      {pdfLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="mr-2 h-4 w-4" />
                      )}
                      {pdfLoading ? 'Đang dựng PDF...' : 'Tải bản PDF'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

/** Thẻ tóm tắt một chứng chỉ trong danh sách. */
const CertificateCard = ({
  cert,
  onView,
}: {
  cert: Certificate;
  onView: () => void;
}) => (
  <Card className="group overflow-hidden border-border shadow-none transition-colors hover:border-primary/50">
    {/* Vạch trạng thái: còn hiệu lực dùng màu hành động, đã thu hồi để trung tính.
        Ý nghĩa vẫn do phù hiệu chữ bên dưới gánh, vạch chỉ là dấu nhắc. */}
    <div
      className={`h-1.5 w-full ${cert.isValid ? 'bg-primary' : 'bg-muted'}`}
    />
    <CardContent className="p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 font-semibold leading-snug" title={cert.courseNameSnapshot}>
          {cert.courseNameSnapshot}
        </h3>
        {cert.isValid ? (
          <Badge className="shrink-0 bg-success text-success-foreground hover:bg-success">
            <ShieldCheck className="mr-1 h-3 w-3" aria-hidden="true" />
            Hợp lệ
          </Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0">
            <ShieldAlert className="mr-1 h-3 w-3" aria-hidden="true" />
            Đã thu hồi
          </Badge>
        )}
      </div>

      <p className="mb-1 font-mono text-xs tracking-wide text-muted-foreground">
        {cert.certificateCode}
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        Cấp ngày {formatDate(cert.issuedAt)}
        {cert.courseVersionNumber > 1 && ` · Giáo trình v${cert.courseVersionNumber}`}
      </p>

      <div className="flex gap-2">
        <Button onClick={onView} size="sm" className="flex-1">
          <Eye className="mr-1.5 h-4 w-4" />
          Xem
        </Button>
        <a
          href={cert.verifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          title="Trang xác minh công khai"
        >
          <ShieldCheck className="h-4 w-4" />
        </a>
      </div>
    </CardContent>
  </Card>
);

export default CertificatesPage;
