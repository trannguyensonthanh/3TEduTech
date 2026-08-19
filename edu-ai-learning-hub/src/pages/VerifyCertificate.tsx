// src/pages/VerifyCertificate.tsx
//
// [THÊM 17/08/2026 — LEVEL 2, mục 2.2]
//
// TRANG XÁC MINH CÔNG KHAI — đây là đích đến của mã QR in trên chứng chỉ.
//
// ⚠️ Trang này CỐ Ý nằm ngoài mọi ProtectedRoute. Toàn bộ giá trị của tấm chứng
// chỉ nằm ở chỗ NGƯỜI NGOÀI kiểm chứng được nó. Một nhà tuyển dụng quét mã QR
// sẽ không có (và không nên cần) tài khoản 3TEduTech; bắt đăng nhập ở đây là
// làm hỏng đúng thứ mà tính năng này sinh ra để phục vụ.

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Loader2,
  Search,
  WifiOff,
  ArrowLeft,
} from 'lucide-react';

import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CertificateDisplay } from '@/components/certificates/CertificateDisplay';
import {
  verifyCertificate,
  type VerificationResult,
} from '@/services/certificate.service';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

/** Cấu hình hiển thị cho từng trạng thái xác minh. */
const STATUS_UI: Record<
  string,
  {
    icon: React.ElementType;
    title: string;
    ring: string;
    text: string;
    bg: string;
  }
> = {
  VALID: {
    icon: ShieldCheck,
    title: 'Chứng chỉ hợp lệ',
    ring: 'border-emerald-500/40',
    text: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  REVOKED: {
    icon: ShieldAlert,
    title: 'Chứng chỉ đã bị thu hồi',
    ring: 'border-amber-500/40',
    text: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  TAMPERED: {
    icon: ShieldX,
    title: 'Chứng chỉ không toàn vẹn',
    ring: 'border-red-500/40',
    text: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  NOT_FOUND: {
    icon: Search,
    title: 'Không tìm thấy chứng chỉ',
    ring: 'border-slate-500/40',
    text: 'text-slate-500',
    bg: 'bg-slate-500/10',
  },
};

const VerifyCertificatePage: React.FC = () => {
  const { code: codeFromUrl } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState(codeFromUrl || '');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  /* Tách RIÊNG lỗi mạng khỏi kết quả xác minh.
     Backend luôn trả 200 cho mọi trạng thái, nên nhánh catch chỉ xảy ra khi
     thực sự không gọi được API. Gộp hai thứ này lại sẽ khiến người dùng mất
     mạng nhìn thấy dòng "chứng chỉ không hợp lệ" — một lời buộc tội sai. */
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    if (!codeFromUrl) return;

    let active = true;
    setLoading(true);
    setNetworkError(false);

    verifyCertificate(codeFromUrl)
      .then((res) => {
        if (active) setResult(res);
      })
      .catch((err) => {
        if (!active) return;
        // 400 = mã sai định dạng, do Joi chặn ở backend. Đó vẫn là một câu trả
        // lời hợp lệ về nội dung ("mã này không phải của chúng tôi"), không
        // phải sự cố kết nối.
        if ((err as { status?: number })?.status === 400) {
          setResult({
            isValid: false,
            status: 'NOT_FOUND',
            message:
              'Mã chứng chỉ không đúng định dạng của 3TEduTech (ví dụ hợp lệ: 3TEDU-2026-A1B2C3D4E5).',
          });
        } else {
          setNetworkError(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [codeFromUrl]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputCode.trim().toUpperCase();
    if (!code) return;
    // Điều hướng thay vì gọi API thẳng: URL luôn phản ánh mã đang tra cứu, nên
    // người dùng chia sẻ được đường dẫn và nút Back của trình duyệt hoạt động đúng.
    navigate(`/verify-certificate/${encodeURIComponent(code)}`);
  };

  const ui = result ? STATUS_UI[result.status] : null;
  const StatusIcon = ui?.icon;

  return (
    <Layout>
      <div className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
        {/* Tiêu đề */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Xác minh chứng chỉ 3TEduTech
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Nhập mã chứng chỉ hoặc quét mã QR in trên chứng chỉ để kiểm tra tính
            xác thực. Không cần tài khoản.
          </p>
        </div>

        {/* Ô tra cứu */}
        <form onSubmit={handleSearch} className="mx-auto mb-10 flex max-w-xl gap-2">
          <Input
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="3TEDU-2026-A1B2C3D4E5"
            className="font-mono uppercase tracking-wider"
            autoCapitalize="characters"
            spellCheck={false}
          />
          <Button type="submit" disabled={loading || !inputCode.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Kiểm tra</span>
          </Button>
        </form>

        {/* Đang tải */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin" />
            <p className="text-sm">Đang đối chiếu với hệ thống...</p>
          </div>
        )}

        {/* Lỗi mạng — KHÁC hẳn với "chứng chỉ không hợp lệ" */}
        {!loading && networkError && (
          <Card className="mx-auto max-w-xl border-slate-500/40">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <WifiOff className="h-9 w-9 text-slate-500" />
              <p className="font-semibold">Không kết nối được tới máy chủ</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Đây là sự cố kết nối, chưa kết luận được gì về chứng chỉ. Vui
                lòng kiểm tra mạng và thử lại.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate(0)}
                className="mt-2"
              >
                Thử lại
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Kết quả */}
        {!loading && !networkError && result && ui && StatusIcon && (
          <div className="space-y-8">
            <Card className={`mx-auto max-w-2xl border-2 ${ui.ring}`}>
              <CardContent className="flex items-start gap-4 py-6">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${ui.bg}`}
                >
                  <StatusIcon className={`h-6 w-6 ${ui.text}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-lg font-bold ${ui.text}`}>{ui.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {result.message}
                  </p>

                  {result.status === 'REVOKED' && (
                    <div className="mt-3 rounded-md bg-amber-500/10 p-3 text-sm">
                      <p>
                        <span className="text-muted-foreground">
                          Thời điểm thu hồi:{' '}
                        </span>
                        {formatDate(result.revokedAt)}
                      </p>
                      {result.revokedReason && (
                        <p className="mt-1">
                          <span className="text-muted-foreground">
                            Lý do:{' '}
                          </span>
                          {result.revokedReason}
                        </p>
                      )}
                    </div>
                  )}

                  {result.certificate && (
                    <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      <Row label="Học viên" value={result.certificate.studentName} />
                      <Row label="Khóa học" value={result.certificate.courseName} />
                      <Row
                        label="Giảng viên"
                        value={result.certificate.instructorName || '—'}
                      />
                      <Row
                        label="Ngày cấp"
                        value={formatDate(result.certificate.issuedAt)}
                      />
                      <Row
                        label="Phiên bản giáo trình"
                        value={`v${result.certificate.courseVersionNumber}`}
                      />
                      <Row
                        label="Mã chứng chỉ"
                        value={result.certificate.certificateCode}
                        mono
                      />
                    </dl>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bản chứng chỉ — chỉ hiện khi tìm thấy bản ghi thật.
                KHÔNG hiện với TAMPERED: dựng lại một tấm chứng chỉ trông y như
                thật từ dữ liệu đã bị can thiệp chính là giúp kẻ giả mạo có ảnh
                đẹp để đi khoe. */}
            {result.certificate && result.status !== 'TAMPERED' && (
              <CertificateDisplay
                studentName={result.certificate.studentName}
                courseName={result.certificate.courseName}
                instructorName={result.certificate.instructorName}
                completionDate={formatDate(
                  result.certificate.completedAt || result.certificate.issuedAt
                )}
                certificateCode={result.certificate.certificateCode}
                verifyUrl={result.certificate.verifyUrl}
                courseVersionNumber={result.certificate.courseVersionNumber}
                totalLessons={result.certificate.totalLessons}
                finalQuizAverage={result.certificate.finalQuizAverage}
                categoryName={result.certificate.categoryName}
                levelName={result.certificate.levelName}
                isValid={result.isValid}
                showDownloadButton={false}
              />
            )}
          </div>
        )}

        {/* Chưa nhập gì */}
        {!loading && !networkError && !result && !codeFromUrl && (
          <p className="text-center text-sm text-muted-foreground">
            Nhập mã chứng chỉ ở ô phía trên để bắt đầu.
          </p>
        )}

        <div className="mt-12 text-center">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

const Row = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="min-w-0">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd
      className={`truncate font-medium ${mono ? 'font-mono tracking-wide' : ''}`}
      title={value}
    >
      {value}
    </dd>
  </div>
);

export default VerifyCertificatePage;
