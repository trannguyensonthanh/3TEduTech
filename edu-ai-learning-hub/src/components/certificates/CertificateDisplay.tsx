// src/components/certificates/CertificateDisplay.tsx
//
// [THIẾT KẾ LẠI 17/08/2026 — LEVEL 2, mục 2.2]
//
// Chứng chỉ phong cách "công nghệ": nền tối, lưới mạch điện, dấu niêm phong
// ánh kim, mã QR xác minh. Thay cho bản cũ dùng font thư pháp trên nền giấy —
// đẹp nhưng không ăn nhập với một nền tảng học công nghệ, và quan trọng hơn là
// KHÔNG có cách nào xác minh được.
//
/* ============================================================================
   RÀNG BUỘC KỸ THUẬT QUAN TRỌNG — html2canvas
   ----------------------------------------------------------------------------
   Khối này được chụp lại thành PNG bằng html2canvas. Thư viện đó KHÔNG dựng
   được một số hiệu ứng CSS hiện đại, và điều tệ nhất là nó IM LẶNG: trên màn
   hình vẫn đẹp, nhưng file PNG tải về bị mất chữ hoặc mất nền.

   Đã CỐ Ý TRÁNH:
     • bg-clip-text / text-fill-transparent  → chữ gradient sẽ MẤT HẲN trong ảnh
     • backdrop-blur, filter: blur()         → không được dựng
     • mask, conic-gradient                  → không được dựng

   ĐƯỢC PHÉP DÙNG (đã kiểm chứng với html2canvas 1.4.x):
     • linear-gradient / radial-gradient trong background
     • SVG nội tuyến (dùng cho lưới mạch và dấu niêm phong)
     • box-shadow, border, text-shadow
     • <canvas> đã vẽ sẵn — nên mã QR dùng QRCodeCanvas chứ không dùng QRCodeSVG

   Hiệu ứng ánh sáng vì thế được làm bằng radial-gradient và SVG, không dùng
   blur. Nhìn vẫn "phát sáng" mà chụp ra ảnh không sai một nét.
============================================================================ */

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Loader2, ShieldCheck, Copy, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CertificateDisplayProps {
  studentName: string;
  courseName: string;
  instructorName?: string | null;
  /** Đã định dạng sẵn dd/MM/yyyy */
  completionDate: string;
  /** Mã thật do server cấp, ví dụ 3TEDU-2026-A1B2C3D4E5 */
  certificateCode: string;
  /** Đường dẫn trang xác minh công khai — cũng là nội dung mã QR */
  verifyUrl: string;
  courseVersionNumber?: number | null;
  totalLessons?: number | null;
  finalQuizAverage?: number | null;
  categoryName?: string | null;
  levelName?: string | null;
  logoUrl?: string;
  /** false = đã bị thu hồi → hiện dải cảnh báo */
  isValid?: boolean;
  /** Ẩn nút tải khi nhúng trong trang xác minh công khai */
  showDownloadButton?: boolean;
  className?: string;
}

/* --------------------------------------------------------------------------
 * Các lớp trang trí — tách riêng cho dễ đọc phần bố cục chính
 * ------------------------------------------------------------------------ */

/**
 * Lưới mạch điện nền.
 *
 * Dùng SVG <pattern> thay vì lặp div: một phần tử duy nhất, tự co giãn theo
 * kích thước khung, và html2canvas rasterize được nguyên vẹn.
 */
const CircuitGrid = () => (
  <svg
    className="absolute inset-0 h-full w-full"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <pattern
        id="cert-grid"
        width="40"
        height="40"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 40 0 L 0 0 0 40"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="0.5"
          opacity="0.12"
        />
      </pattern>
      <pattern
        id="cert-dots"
        width="40"
        height="40"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="0" cy="0" r="1.3" fill="#38bdf8" opacity="0.28" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#cert-grid)" />
    <rect width="100%" height="100%" fill="url(#cert-dots)" />
  </svg>
);

/** Đường mạch trang trí ở hai góc đối nhau. */
const CircuitTraces = () => (
  <svg
    className="absolute inset-0 h-full w-full"
    viewBox="0 0 1000 707"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g stroke="#22d3ee" strokeWidth="1.2" fill="none" opacity="0.35">
      <path d="M0 120 H90 L120 90 H210" />
      <path d="M0 160 H60 L100 120 H180 L200 100 H260" />
      <path d="M1000 587 H910 L880 617 H790" />
      <path d="M1000 547 H940 L900 587 H820 L800 607 H740" />
    </g>
    <g fill="#22d3ee" opacity="0.55">
      <circle cx="210" cy="90" r="3.5" />
      <circle cx="260" cy="100" r="3.5" />
      <circle cx="790" cy="617" r="3.5" />
      <circle cx="740" cy="607" r="3.5" />
    </g>
  </svg>
);

/**
 * Dấu niêm phong ánh kim.
 * Vòng ngoài đứt nét gợi cảm giác "đang quét/đang xác thực" — chi tiết nhỏ
 * nhưng là thứ khiến tấm chứng chỉ trông như do máy cấp chứ không phải in sẵn.
 */
const HoloSeal = ({ isValid = true }: { isValid?: boolean }) => (
  <svg
    viewBox="0 0 120 120"
    className="h-[92px] w-[92px] md:h-[110px] md:w-[110px]"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="seal-ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="45%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
      <linearGradient id="seal-core" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.18" />
      </linearGradient>
    </defs>

    <circle
      cx="60"
      cy="60"
      r="56"
      fill="none"
      stroke="url(#seal-ring)"
      strokeWidth="1.5"
      strokeDasharray="5 7"
      opacity={isValid ? 0.85 : 0.35}
    />
    <circle
      cx="60"
      cy="60"
      r="47"
      fill="none"
      stroke="url(#seal-ring)"
      strokeWidth="2.5"
      opacity={isValid ? 0.95 : 0.4}
    />
    {/* Lục giác — mô-típ quen thuộc của hạ tầng/công nghệ */}
    <polygon
      points="60,22 93,41 93,79 60,98 27,79 27,41"
      fill="url(#seal-core)"
      stroke="url(#seal-ring)"
      strokeWidth="1.5"
      opacity={isValid ? 1 : 0.45}
    />
    <text
      x="60"
      y="56"
      textAnchor="middle"
      fill="#e0f2fe"
      fontSize="19"
      fontWeight="700"
      fontFamily="Helvetica, Arial, sans-serif"
      letterSpacing="1"
    >
      3T
    </text>
    <text
      x="60"
      y="74"
      textAnchor="middle"
      fill="#7dd3fc"
      fontSize="9.5"
      fontWeight="600"
      fontFamily="Helvetica, Arial, sans-serif"
      letterSpacing="2.5"
    >
      VERIFIED
    </text>
  </svg>
);

/** Ngoặc góc kiểu HUD. */
const CornerBracket = ({
  position,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
}) => {
  const base = 'absolute w-14 h-14 md:w-20 md:h-20 pointer-events-none';
  const map: Record<string, string> = {
    tl: 'top-5 left-5 md:top-7 md:left-7 border-t-2 border-l-2 rounded-tl-lg',
    tr: 'top-5 right-5 md:top-7 md:right-7 border-t-2 border-r-2 rounded-tr-lg',
    bl: 'bottom-5 left-5 md:bottom-7 md:left-7 border-b-2 border-l-2 rounded-bl-lg',
    br: 'bottom-5 right-5 md:bottom-7 md:right-7 border-b-2 border-r-2 rounded-br-lg',
  };
  return (
    <div
      className={cn(base, map[position])}
      style={{ borderColor: 'rgba(34, 211, 238, 0.55)' }}
      aria-hidden="true"
    />
  );
};

/* --------------------------------------------------------------------------
 * Component chính
 * ------------------------------------------------------------------------ */

export const CertificateDisplay: React.FC<CertificateDisplayProps> = ({
  studentName,
  courseName,
  instructorName,
  completionDate,
  certificateCode,
  verifyUrl,
  courseVersionNumber,
  totalLessons,
  finalQuizAverage,
  categoryName,
  levelName,
  logoUrl = '/images/logo/3telogo.jpeg',
  isValid = true,
  showDownloadButton = true,
  className,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownloadPNG = async () => {
    if (!certificateRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        // scale 3 cho ảnh đủ nét khi in A4 ngang. Cao hơn nữa thì file phình to
        // và trình duyệt trên máy yếu dễ hết bộ nhớ khi vẽ canvas.
        scale: 3,
        useCORS: true,
        // Nền tối phải chỉ định TƯỜNG MINH. Để null thì html2canvas xuất nền
        // trong suốt; mở file PNG trên nền trắng sẽ thấy chữ trắng biến mất.
        backgroundColor: '#070d1b',
        logging: false,
      });
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `ChungChi-${certificateCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Lỗi tạo ảnh chứng chỉ:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(certificateCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API cần ngữ cảnh bảo mật (HTTPS hoặc localhost). Trên HTTP
      // thuần nó ném lỗi — nuốt lặng thay vì làm sập giao diện; mã vẫn hiện
      // trên màn hình để người dùng bôi đen copy tay.
    }
  };

  return (
    <div className={cn('flex w-full flex-col items-center', className)}>
      <div
        ref={certificateRef}
        className="relative aspect-[1.414/1] w-full max-w-[1000px] overflow-hidden rounded-xl shadow-2xl"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 0%, #14304f 0%, transparent 60%),' +
            'radial-gradient(ellipse 70% 60% at 85% 100%, #2a1a4d 0%, transparent 55%),' +
            'linear-gradient(150deg, #070d1b 0%, #0c1830 45%, #080f22 100%)',
        }}
      >
        {/* --- Các lớp nền trang trí --- */}
        <CircuitGrid />
        <CircuitTraces />

        {/* Viền phát sáng: dùng inset box-shadow thay cho blur (html2canvas dựng được) */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            boxShadow:
              'inset 0 0 0 1px rgba(56,189,248,0.28), inset 0 0 60px rgba(56,189,248,0.07)',
          }}
          aria-hidden="true"
        />

        <CornerBracket position="tl" />
        <CornerBracket position="tr" />
        <CornerBracket position="bl" />
        <CornerBracket position="br" />

        {/* Dải cảnh báo khi chứng chỉ đã bị thu hồi */}
        {!isValid && (
          <div
            className="absolute left-0 right-0 top-0 z-30 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.25em] text-white"
            style={{ backgroundColor: 'rgba(220, 38, 38, 0.92)' }}
          >
            Chứng chỉ đã bị thu hồi
          </div>
        )}

        {/* --- Nội dung --- */}
        <div className="relative z-20 flex h-full flex-col justify-between px-8 py-9 md:px-14 md:py-12">
          {/* Đầu trang */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="3TEduTech"
                  className="h-9 w-9 rounded-md object-cover md:h-11 md:w-11"
                  crossOrigin="anonymous"
                />
              )}
              <div className="text-left">
                <p className="text-sm font-bold tracking-[0.2em] text-white md:text-base">
                  3TEDUTECH
                </p>
                <p className="text-[9px] tracking-[0.28em] text-cyan-300/70 md:text-[10px]">
                  ONLINE LEARNING PLATFORM
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[9px] tracking-[0.28em] text-slate-400 md:text-[10px]">
                CERTIFICATE ID
              </p>
              <p
                className="text-[11px] font-bold tracking-wider text-cyan-300 md:text-sm"
                style={{ fontFamily: "'Courier New', Courier, monospace" }}
              >
                {certificateCode}
              </p>
            </div>
          </div>

          {/* Giữa trang */}
          <div className="flex flex-col items-center text-center">
            <p className="text-[10px] font-semibold tracking-[0.42em] text-cyan-300/85 md:text-xs">
              CHỨNG CHỈ HOÀN THÀNH
            </p>
            <div
              className="mx-auto mt-3 h-px w-40 md:w-56"
              style={{
                background:
                  'linear-gradient(90deg, transparent, #22d3ee, #a855f7, transparent)',
              }}
            />

            <p className="mt-6 text-[11px] tracking-[0.18em] text-slate-400 md:text-xs">
              CHỨNG NHẬN
            </p>

            {/* Tên học viên: trắng đặc + text-shadow để "phát sáng".
                KHÔNG dùng gradient chữ vì html2canvas sẽ làm mất hẳn. */}
            <h2
              className="mt-2 break-words px-4 text-3xl font-bold leading-tight text-white md:text-5xl"
              style={{ textShadow: '0 0 26px rgba(56, 189, 248, 0.55)' }}
            >
              {studentName}
            </h2>

            <p className="mt-5 text-[11px] tracking-[0.18em] text-slate-400 md:text-xs">
              ĐÃ HOÀN THÀNH KHÓA HỌC
            </p>
            <h3 className="mt-2 break-words px-6 text-lg font-semibold leading-snug text-cyan-200 md:text-2xl">
              {courseName}
            </h3>

            {/* Chỉ số nhanh */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2">
              {typeof totalLessons === 'number' && totalLessons > 0 && (
                <StatChip label={`${totalLessons} bài học`} />
              )}
              {typeof finalQuizAverage === 'number' && (
                <StatChip
                  label={`Điểm TB ${Number(finalQuizAverage).toFixed(1)}`}
                  highlight
                />
              )}
              {levelName && <StatChip label={levelName} />}
              {categoryName && <StatChip label={categoryName} />}
              {typeof courseVersionNumber === 'number' && (
                <StatChip label={`Giáo trình v${courseVersionNumber}`} />
              )}
            </div>
          </div>

          {/* Chân trang */}
          <div className="flex items-end justify-between gap-4">
            {/* Giảng viên + ngày */}
            <div className="flex gap-6 md:gap-10">
              <SignatureBlock
                value={instructorName || '—'}
                label="GIẢNG VIÊN"
              />
              <SignatureBlock value={completionDate} label="NGÀY HOÀN THÀNH" />
            </div>

            {/* Dấu niêm phong */}
            <div className="hidden shrink-0 sm:block">
              <HoloSeal isValid={isValid} />
            </div>

            {/* Mã QR xác minh */}
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <div
                className="rounded-md bg-white p-1.5 md:p-2"
                style={{ boxShadow: '0 0 20px rgba(56,189,248,0.32)' }}
              >
                {/* QRCodeCanvas (không phải QRCodeSVG): html2canvas sao chép
                    nội dung <canvas> đã vẽ đáng tin cậy hơn nhiều so với việc
                    tự dựng lại một cây SVG. */}
                <QRCodeCanvas
                  value={verifyUrl}
                  size={72}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#070d1b"
                />
              </div>
              <p className="text-[8px] tracking-[0.2em] text-slate-400 md:text-[9px]">
                QUÉT ĐỂ XÁC MINH
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Thanh hành động (nằm NGOÀI vùng chụp ảnh) --- */}
      {showDownloadButton && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={handleDownloadPNG} size="lg" disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Download className="mr-2 h-5 w-5" />
            )}
            {isExporting ? 'Đang tạo ảnh...' : 'Tải ảnh PNG'}
          </Button>

          <Button onClick={handleCopyCode} variant="outline" size="lg">
            {copied ? (
              <Check className="mr-2 h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? 'Đã sao chép' : 'Sao chép mã'}
          </Button>

          <a
            href={verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-md border border-input px-6 text-sm font-medium hover:bg-accent"
          >
            <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" />
            Trang xác minh
          </a>
        </div>
      )}
    </div>
  );
};

/** Nhãn chỉ số nhỏ ở giữa chứng chỉ. */
const StatChip = ({
  label,
  highlight = false,
}: {
  label: string;
  highlight?: boolean;
}) => (
  <span
    className="rounded-full px-2.5 py-1 text-[9px] font-medium tracking-wide md:text-[11px]"
    style={
      highlight
        ? {
            color: '#6ee7b7',
            backgroundColor: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.35)',
          }
        : {
            color: '#cbd5e1',
            backgroundColor: 'rgba(148,163,184,0.10)',
            border: '1px solid rgba(148,163,184,0.25)',
          }
    }
  >
    {label}
  </span>
);

/** Một ô "chữ ký": giá trị nằm trên đường kẻ, nhãn nằm dưới. */
const SignatureBlock = ({
  value,
  label,
}: {
  value: string;
  label: string;
}) => (
  <div className="text-left">
    <p className="pb-1.5 text-xs font-semibold text-slate-100 md:text-sm">
      {value}
    </p>
    <div
      className="h-px w-28 md:w-36"
      style={{
        background: 'linear-gradient(90deg, #22d3ee, rgba(34,211,238,0.05))',
      }}
    />
    <p className="mt-1.5 text-[8px] tracking-[0.22em] text-slate-400 md:text-[10px]">
      {label}
    </p>
  </div>
);

export default CertificateDisplay;
