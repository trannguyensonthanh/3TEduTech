// src/components/certificates/HiddenQrCanvas.tsx
//
// [THÊM 17/08/2026 — LEVEL 2, mục 2.2]
//
// Vẽ mã QR ra một <canvas> nằm ngoài màn hình rồi trả về chuỗi PNG data URL.
//
// VÌ SAO CẦN: @react-pdf/renderer dựng PDF bằng bộ primitive riêng, không dùng
// DOM — nên không thể đặt <QRCodeCanvas> của qrcode.react vào trong <Document>.
// Cách rẻ nhất để có mã QR trong PDF là biến nó thành ẢNH trước, rồi truyền vào
// <Image src={...} />.
//
// VÌ SAO KHÔNG DÙNG `display: none`: trình duyệt không bố trí (layout) phần tử
// bị display:none, nên <canvas> bên trong có thể chưa được vẽ và toDataURL()
// trả về một ảnh trắng. Vì vậy dùng thủ thuật đẩy ra ngoài khung nhìn — phần tử
// vẫn được dựng đầy đủ nhưng người dùng không thấy.

import React, { useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface HiddenQrCanvasProps {
  /** Nội dung mã hóa vào QR — chính là URL trang xác minh. */
  value: string;
  /** Kích thước cạnh (px). 220 cho ảnh đủ nét khi in ở ~62pt trong PDF. */
  size?: number;
  /** Gọi lại đúng một lần khi ảnh đã sẵn sàng. */
  onReady: (dataUrl: string) => void;
}

export const HiddenQrCanvas: React.FC<HiddenQrCanvasProps> = ({
  value,
  size = 220,
  onReady,
}) => {
  const holderRef = useRef<HTMLDivElement>(null);
  // Giữ callback trong ref để effect không phải phụ thuộc vào nó. Trang cha
  // thường truyền một hàm inline (định danh đổi mỗi lần render); nếu để nó vào
  // mảng phụ thuộc thì effect chạy lại liên tục và gây vòng lặp cập nhật state.
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    if (!value) return undefined;

    // requestAnimationFrame: đợi trình duyệt vẽ xong khung hình rồi mới đọc
    // canvas. Đọc ngay trong effect có lúc bắt được canvas còn trống.
    const raf = requestAnimationFrame(() => {
      const canvas = holderRef.current?.querySelector('canvas');
      if (!canvas) return;
      try {
        onReadyRef.current(canvas.toDataURL('image/png'));
      } catch (error) {
        // toDataURL ném SecurityError nếu canvas bị "nhiễm bẩn" bởi ảnh chéo
        // miền. QR do chính ta vẽ nên không thể dính, nhưng vẫn bắt cho chắc:
        // thiếu ảnh QR thì PDF in đường dẫn thay thế, không phải lỗi chí mạng.
        console.warn('Không đọc được canvas mã QR:', error);
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [value, size]);

  return (
    <div
      ref={holderRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: -10000,
        top: 0,
        width: size,
        height: size,
        pointerEvents: 'none',
      }}
    >
      <QRCodeCanvas
        value={value}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#070d1b"
      />
    </div>
  );
};

export default HiddenQrCanvas;
