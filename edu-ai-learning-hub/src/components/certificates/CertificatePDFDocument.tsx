// src/components/certificates/CertificatePDFDocument.tsx
//
// [THIẾT KẾ LẠI 17/08/2026 — LEVEL 2, mục 2.2]
// Bản PDF của chứng chỉ, khớp thị giác với CertificateDisplay.tsx.
//
/* ============================================================================
   HAI QUYẾT ĐỊNH KỸ THUẬT QUAN TRỌNG
   ----------------------------------------------------------------------------
   1) FONT PHẢI CÓ TIẾNG VIỆT — đây là bẫy dễ mất cả buổi để tìm ra.

      @react-pdf/renderer mặc định dùng Helvetica, một font PDF chuẩn CHỈ có
      bảng mã Latin cơ bản. Chữ "Nguyễn Văn Đức" sẽ ra "Nguyn Vn c" — các ký
      tự có dấu bị NUỐT MẤT chứ không hiện ô vuông, nên rất dễ tưởng do lỗi dữ
      liệu chứ không nghĩ tới font.

      Bản cũ đăng ký Merriweather / Great Vibes / Lato. Riêng Merriweather và
      Great Vibes trong thư mục public chỉ ~110KB — đó là bản rút gọn Latin,
      gần như chắc chắn thiếu dấu tiếng Việt.

      → Dùng ROBOTO (đã có sẵn public/fonts/Roboto-*.ttf). Roboto của Google có
        đủ bộ ký tự tiếng Việt, và hai file đó vốn đã nằm trong dự án.

   2) MÃ QR ĐƯỢC TRUYỀN VÀO DƯỚI DẠNG ẢNH (data URL).

      qrcode.react là component DOM, không chạy được trong cây render của
      react-pdf. Vì vậy trang gọi sẽ vẽ QR ra <canvas> ẩn, lấy toDataURL() rồi
      truyền xuống đây. Xem HiddenQrCanvas.tsx.
============================================================================ */

import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  Image,
  Svg,
  Path,
  Circle,
  Polygon,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from '@react-pdf/renderer';

/* Đăng ký font ở cấp module → chỉ chạy một lần cho cả vòng đời ứng dụng.
   Đặt trong component sẽ đăng ký lại mỗi lần render, gây cảnh báo và render lỗi. */
Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
  ],
});

/* Tắt tự động ngắt từ. react-pdf mặc định gạch nối theo thuật toán tiếng Anh,
   áp lên tiếng Việt sẽ cho ra những chỗ ngắt rất kỳ quặc ("chứ-ng chỉ"). */
Font.registerHyphenationCallback((word) => [word]);

const COLORS = {
  bg: '#070d1b',
  bgMid: '#0c1830',
  cyan: '#22d3ee',
  cyanSoft: '#7dd3fc',
  cyanPale: '#a5f3fc',
  violet: '#a855f7',
  white: '#ffffff',
  slate: '#94a3b8',
  slateLight: '#cbd5e1',
  emerald: '#6ee7b7',
};

export interface CertificatePDFProps {
  studentName: string;
  courseName: string;
  instructorName?: string | null;
  completionDate: string;
  certificateCode: string;
  verifyUrl: string;
  /** PNG data URL của mã QR (do HiddenQrCanvas sinh ra) */
  qrDataUrl?: string | null;
  courseVersionNumber?: number | null;
  totalLessons?: number | null;
  finalQuizAverage?: number | null;
  categoryName?: string | null;
  levelName?: string | null;
  logoUrl?: string;
  isValid?: boolean;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    backgroundColor: COLORS.bg,
    position: 'relative',
  },
  // Toàn bộ nội dung nằm trên một lớp tuyệt đối phủ kín trang, để các lớp SVG
  // trang trí nằm dưới mà không đẩy bố cục.
  contentLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 46,
    paddingVertical: 38,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 34, height: 34, borderRadius: 5, marginRight: 9 },
  brandName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2.2,
  },
  brandSub: { fontSize: 6, color: COLORS.cyanSoft, letterSpacing: 2.4 },
  idLabel: {
    fontSize: 6,
    color: COLORS.slate,
    letterSpacing: 2.4,
    textAlign: 'right',
  },
  idValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.cyan,
    letterSpacing: 1.1,
    textAlign: 'right',
    marginTop: 2,
  },

  center: { alignItems: 'center' },
  kicker: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.cyanPale,
    letterSpacing: 4.2,
  },
  rule: { width: 150, height: 1.2, backgroundColor: COLORS.cyan, marginTop: 9 },
  smallLabel: {
    fontSize: 7.5,
    color: COLORS.slate,
    letterSpacing: 2,
    marginTop: 16,
  },
  studentName: {
    fontSize: 34,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 6,
    textAlign: 'center',
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.cyanPale,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 14,
  },
  chip: {
    fontSize: 7,
    color: COLORS.slateLight,
    borderWidth: 0.7,
    borderColor: 'rgba(148,163,184,0.45)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
    marginHorizontal: 2.5,
    marginBottom: 3,
  },
  chipHighlight: {
    color: COLORS.emerald,
    borderColor: 'rgba(16,185,129,0.6)',
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sigGroup: { flexDirection: 'row' },
  sigBlock: { marginRight: 30 },
  sigValue: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  sigLine: { width: 96, height: 1, backgroundColor: COLORS.cyan },
  sigLabel: {
    fontSize: 6,
    color: COLORS.slate,
    letterSpacing: 1.8,
    marginTop: 4,
  },

  qrBox: { alignItems: 'center' },
  qrFrame: { backgroundColor: '#ffffff', padding: 4, borderRadius: 4 },
  qrImage: { width: 62, height: 62 },
  qrLabel: {
    fontSize: 5.5,
    color: COLORS.slate,
    letterSpacing: 1.6,
    marginTop: 4,
  },

  revokedBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#dc2626',
    paddingVertical: 5,
  },
  revokedText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 3,
    textAlign: 'center',
  },
});

/** Lưới + đường mạch + ngoặc góc, vẽ bằng một khối SVG phủ kín trang A4 ngang. */
const Decoration = () => (
  <Svg
    style={{ position: 'absolute', top: 0, left: 0 }}
    width={842}
    height={595}
    viewBox="0 0 842 595"
  >
    <Defs>
      <LinearGradient id="pdfGlow" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#14304f" stopOpacity={0.9} />
        <Stop offset="0.55" stopColor={COLORS.bgMid} stopOpacity={0.55} />
        <Stop offset="1" stopColor="#2a1a4d" stopOpacity={0.8} />
      </LinearGradient>
      <LinearGradient id="pdfSeal" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={COLORS.cyan} />
        <Stop offset="0.5" stopColor="#6366f1" />
        <Stop offset="1" stopColor={COLORS.violet} />
      </LinearGradient>
    </Defs>

    <Rect x={0} y={0} width={842} height={595} fill="url(#pdfGlow)" />

    {/* Lưới. react-pdf KHÔNG hỗ trợ <pattern>, nên vẽ tay từng đường.
        Bước 42pt cho ~20 cột × 14 hàng — đủ thưa để không nặng file. */}
    {Array.from({ length: 21 }, (_, i) => (
      <Path
        key={`v${i}`}
        d={`M ${i * 42} 0 L ${i * 42} 595`}
        stroke={COLORS.cyan}
        strokeWidth={0.4}
        strokeOpacity={0.1}
      />
    ))}
    {Array.from({ length: 15 }, (_, i) => (
      <Path
        key={`h${i}`}
        d={`M 0 ${i * 42} L 842 ${i * 42}`}
        stroke={COLORS.cyan}
        strokeWidth={0.4}
        strokeOpacity={0.1}
      />
    ))}

    {/* Đường mạch trang trí */}
    <Path
      d="M0 105 H76 L102 79 H178"
      stroke={COLORS.cyan}
      strokeWidth={1}
      strokeOpacity={0.35}
      fill="none"
    />
    <Path
      d="M0 138 H50 L84 105 H152 L170 88 H220"
      stroke={COLORS.cyan}
      strokeWidth={1}
      strokeOpacity={0.28}
      fill="none"
    />
    <Path
      d="M842 490 H766 L740 516 H664"
      stroke={COLORS.cyan}
      strokeWidth={1}
      strokeOpacity={0.35}
      fill="none"
    />
    <Path
      d="M842 457 H792 L758 490 H690 L672 507 H622"
      stroke={COLORS.cyan}
      strokeWidth={1}
      strokeOpacity={0.28}
      fill="none"
    />
    <Circle cx={178} cy={79} r={3} fill={COLORS.cyan} fillOpacity={0.6} />
    <Circle cx={220} cy={88} r={3} fill={COLORS.cyan} fillOpacity={0.6} />
    <Circle cx={664} cy={516} r={3} fill={COLORS.cyan} fillOpacity={0.6} />
    <Circle cx={622} cy={507} r={3} fill={COLORS.cyan} fillOpacity={0.6} />

    {/* Ngoặc góc kiểu HUD */}
    <Path
      d="M28 74 V28 H74"
      stroke={COLORS.cyan}
      strokeWidth={1.8}
      strokeOpacity={0.6}
      fill="none"
    />
    <Path
      d="M768 28 H814 V74"
      stroke={COLORS.cyan}
      strokeWidth={1.8}
      strokeOpacity={0.6}
      fill="none"
    />
    <Path
      d="M28 521 V567 H74"
      stroke={COLORS.cyan}
      strokeWidth={1.8}
      strokeOpacity={0.6}
      fill="none"
    />
    <Path
      d="M768 567 H814 V521"
      stroke={COLORS.cyan}
      strokeWidth={1.8}
      strokeOpacity={0.6}
      fill="none"
    />

    {/* Viền trong */}
    <Rect
      x={20}
      y={20}
      width={802}
      height={555}
      stroke={COLORS.cyan}
      strokeWidth={0.8}
      strokeOpacity={0.28}
      fill="none"
      rx={8}
    />
  </Svg>
);

/** Dấu niêm phong ánh kim (đặt ở góc phải dưới, giữa chữ ký và mã QR). */
const Seal = ({ isValid }: { isValid: boolean }) => (
  <Svg width={82} height={82} viewBox="0 0 120 120">
    <Defs>
      <LinearGradient id="sealRingPdf" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={COLORS.cyan} />
        <Stop offset="0.45" stopColor="#6366f1" />
        <Stop offset="1" stopColor={COLORS.violet} />
      </LinearGradient>
    </Defs>
    <Circle
      cx={60}
      cy={60}
      r={56}
      fill="none"
      stroke="url(#sealRingPdf)"
      strokeWidth={1.4}
      strokeDasharray="5 7"
      strokeOpacity={isValid ? 0.85 : 0.3}
    />
    <Circle
      cx={60}
      cy={60}
      r={47}
      fill="none"
      stroke="url(#sealRingPdf)"
      strokeWidth={2.4}
      strokeOpacity={isValid ? 0.95 : 0.35}
    />
    <Polygon
      points="60,22 93,41 93,79 60,98 27,79 27,41"
      fill="#0ea5e9"
      fillOpacity={isValid ? 0.22 : 0.08}
      stroke="url(#sealRingPdf)"
      strokeWidth={1.4}
      strokeOpacity={isValid ? 1 : 0.4}
    />
  </Svg>
);

export const CertificatePDFDocument: React.FC<CertificatePDFProps> = ({
  studentName,
  courseName,
  instructorName,
  completionDate,
  certificateCode,
  verifyUrl,
  qrDataUrl,
  courseVersionNumber,
  totalLessons,
  finalQuizAverage,
  categoryName,
  levelName,
  logoUrl = '/images/logo/3telogo.jpeg',
  isValid = true,
}) => {
  const chips: Array<{ label: string; highlight?: boolean }> = [];
  if (typeof totalLessons === 'number' && totalLessons > 0) {
    chips.push({ label: `${totalLessons} bài học` });
  }
  if (typeof finalQuizAverage === 'number') {
    chips.push({
      label: `Điểm TB ${Number(finalQuizAverage).toFixed(1)}`,
      highlight: true,
    });
  }
  if (levelName) chips.push({ label: levelName });
  if (categoryName) chips.push({ label: categoryName });
  if (typeof courseVersionNumber === 'number') {
    chips.push({ label: `Giáo trình v${courseVersionNumber}` });
  }

  return (
    <Document
      title={`Chứng chỉ ${certificateCode}`}
      author="3TEduTech"
      subject={courseName}
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Decoration />

        {!isValid && (
          <View style={styles.revokedBanner}>
            <Text style={styles.revokedText}>CHỨNG CHỈ ĐÃ BỊ THU HỒI</Text>
          </View>
        )}

        <View style={styles.contentLayer}>
          {/* Đầu trang */}
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              {/* src có thể là đường dẫn tương đối vì react-pdf chạy trong
                  trình duyệt và tự fetch theo origin hiện tại. */}
              {logoUrl ? <Image style={styles.logo} src={logoUrl} /> : null}
              <View>
                <Text style={styles.brandName}>3TEDUTECH</Text>
                <Text style={styles.brandSub}>ONLINE LEARNING PLATFORM</Text>
              </View>
            </View>
            <View>
              <Text style={styles.idLabel}>CERTIFICATE ID</Text>
              <Text style={styles.idValue}>{certificateCode}</Text>
            </View>
          </View>

          {/* Giữa trang */}
          <View style={styles.center}>
            <Text style={styles.kicker}>CHỨNG CHỈ HOÀN THÀNH</Text>
            <View style={styles.rule} />
            <Text style={styles.smallLabel}>CHỨNG NHẬN</Text>
            <Text style={styles.studentName}>{studentName}</Text>
            <Text style={styles.smallLabel}>ĐÃ HOÀN THÀNH KHÓA HỌC</Text>
            <Text style={styles.courseName}>{courseName}</Text>

            {chips.length > 0 && (
              <View style={styles.chipRow}>
                {chips.map((chip) => (
                  <Text
                    key={chip.label}
                    style={
                      chip.highlight
                        ? [styles.chip, styles.chipHighlight]
                        : styles.chip
                    }
                  >
                    {chip.label}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Chân trang */}
          <View style={styles.footerRow}>
            <View style={styles.sigGroup}>
              <View style={styles.sigBlock}>
                <Text style={styles.sigValue}>{instructorName || '—'}</Text>
                <View style={styles.sigLine} />
                <Text style={styles.sigLabel}>GIẢNG VIÊN</Text>
              </View>
              <View style={styles.sigBlock}>
                <Text style={styles.sigValue}>{completionDate}</Text>
                <View style={styles.sigLine} />
                <Text style={styles.sigLabel}>NGÀY HOÀN THÀNH</Text>
              </View>
            </View>

            <Seal isValid={isValid} />

            <View style={styles.qrBox}>
              {qrDataUrl ? (
                <View style={styles.qrFrame}>
                  <Image style={styles.qrImage} src={qrDataUrl} />
                </View>
              ) : (
                // Không có ảnh QR thì in thẳng đường dẫn — chứng chỉ vẫn xác
                // minh được bằng cách gõ tay, thay vì để một ô trắng vô nghĩa.
                <Text style={{ fontSize: 5.5, color: COLORS.slate }}>
                  {verifyUrl}
                </Text>
              )}
              <Text style={styles.qrLabel}>QUÉT ĐỂ XÁC MINH</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default CertificatePDFDocument;
