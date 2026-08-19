// src/hooks/useCourseRealtime.ts
//
// [THÊM 17/08/2026 — LEVEL 2, mục 2.3]
//
// Kết nối Socket.IO và tham gia "phòng" của một khóa học, để nhận tín hiệu khi
// có bình luận/thảo luận mới mà không phải tải lại trang.
//
/* ============================================================================
   BA ĐIỂM THIẾT KẾ CẦN GIỮ

   1) NẠP THƯ VIỆN THEO KIỂU ĐỘNG (dynamic import).
      `socket.io-client` là phụ thuộc MỚI. Nếu import tĩnh ở đầu file mà máy
      chưa `npm install`, Vite sẽ báo lỗi build và làm hỏng CẢ ứng dụng — chỉ
      vì một tính năng phụ. Với import động, chưa cài gói thì hook chỉ ghi một
      dòng cảnh báo trong console và không làm gì thêm.

   2) MỘT KẾT NỐI DUY NHẤT CHO CẢ ỨNG DỤNG (singleton).
      Mỗi component gọi hook mà mở một socket riêng thì người dùng chuyển vài
      trang là đã có chục kết nối. Ở đây socket được giữ ở cấp module và đếm số
      nơi đang dùng; chỉ đóng khi không còn ai dùng nữa.

   3) CHỈ TRUYỀN TÍN HIỆU, KHÔNG TRUYỀN NỘI DUNG.
      Server chỉ phát "phòng này có thay đổi"; giao diện tự gọi lại REST API để
      lấy dữ liệu. Nhờ vậy quyền xem vẫn do REST API kiểm soát như cũ, và ta
      không phải nhân đôi logic phân quyền sang tầng socket — nơi rất dễ quên.
============================================================================ */

import { useEffect, useRef } from 'react';
import TokenService from '@/services/token.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
type SocketLike = {
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  disconnect: () => void;
  connected: boolean;
};

let sharedSocket: SocketLike | null = null;
let refCount = 0;
let connectingPromise: Promise<SocketLike | null> | null = null;

const getSocket = async (): Promise<SocketLike | null> => {
  if (sharedSocket) return sharedSocket;
  if (connectingPromise) return connectingPromise;

  connectingPromise = (async () => {
    const token = TokenService.getLocalAccessToken();
    // Không có token thì không kết nối: server từ chối ngay ở bước bắt tay, cố
    // kết nối chỉ tạo ra một vòng lặp thử-lại vô ích trong console.
    if (!token) return null;

    try {
      const { io } = await import('socket.io-client');
      const socket = io({
        path: '/socket.io',
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      }) as unknown as SocketLike;

      sharedSocket = socket;
      return socket;
    } catch {
      // Chưa cài `socket.io-client`. Không phải lỗi — chỉ là tính năng realtime
      // hai chiều chưa bật. Thông báo trong ứng dụng vẫn chạy qua SSE.
      console.info(
        '[Realtime] Chưa cài socket.io-client nên bỏ qua kênh realtime hai chiều. ' +
          'Muốn bật: npm install socket.io-client'
      );
      return null;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
};

const releaseSocket = () => {
  refCount -= 1;
  if (refCount <= 0 && sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
    refCount = 0;
  }
};

/**
 * Lắng nghe thay đổi realtime trong phạm vi một khóa học.
 *
 * @param courseId - Khóa học cần theo dõi. Truyền null/undefined để tắt.
 * @param onChange - Gọi khi có thay đổi (thường là refetch danh sách thảo luận).
 */
export const useCourseRealtime = (
  courseId: number | string | null | undefined,
  onChange: (payload: unknown) => void
) => {
  // Giữ callback trong ref: trang gọi thường truyền hàm inline, nếu đưa vào
  // mảng phụ thuộc thì effect chạy lại mỗi lần render → rời/vào phòng liên tục.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!courseId) return undefined;

    let cancelled = false;
    let socketRef: SocketLike | null = null;

    const handler = (payload: unknown) => onChangeRef.current(payload);

    getSocket().then((socket) => {
      if (!socket) return;
      // Component đã unmount trong lúc chờ kết nối → không vào phòng, và cũng
      // KHÔNG tăng refCount (nếu tăng ở đây thì phần dọn dẹp bên dưới đã chạy
      // xong rồi, số đếm sẽ lệch vĩnh viễn và socket không bao giờ được đóng).
      if (cancelled) return;

      refCount += 1;
      socketRef = socket;
      socket.emit('course:join', String(courseId));
      socket.on('discussion:changed', handler);
    });

    return () => {
      cancelled = true;
      if (socketRef) {
        socketRef.emit('course:leave', String(courseId));
        socketRef.off('discussion:changed', handler);
        releaseSocket();
      }
    };
  }, [courseId]);
};

export default useCourseRealtime;
