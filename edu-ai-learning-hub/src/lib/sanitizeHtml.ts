import DOMPurify from 'dompurify';

/**
 * Làm sạch chuỗi HTML trước khi đưa vào `dangerouslySetInnerHTML`.
 *
 * Vì sao cần: dự án có 29 chỗ gọi `dangerouslySetInnerHTML` và trước bản này
 * KHÔNG có bất kỳ bộ lọc nào trong toàn bộ phụ thuộc. Nhiều chỗ trong số đó
 * nhận nội dung do người dùng nhập — bài thảo luận của học viên, phần giới thiệu
 * bản thân (hiển thị ngay trong trang quản trị), mô tả khóa học của giảng viên.
 * Đó là lỗ hổng XSS lưu trữ: kẻ tấn công lưu mã một lần, mã chạy trên trình
 * duyệt của mọi người xem, kể cả quản trị viên.
 *
 * Nặng hơn nữa, một số chỗ còn gọi `he.decode()` ngay trên giá trị `__html`.
 * Máy chủ lưu HTML đã được escape, nên decode chính là KHÔI PHỤC lại
 * `<img onerror=...>` thành thẻ thật. Việc decode vẫn cần (để định dạng do
 * trình soạn thảo tạo ra hiển thị đúng), nhưng phải lọc ngay sau đó.
 *
 * Cấu hình mặc định của DOMPurify đã loại bỏ `<script>`, `<iframe>` và mọi
 * thuộc tính `on*`, đồng thời giữ lại các thẻ định dạng thông thường.
 * `ADD_ATTR: ['target', 'rel']` để liên kết mở tab mới vẫn hoạt động.
 */
export const sanitizeHtml = (dirty: string | null | undefined): string => {
  if (!dirty) {
    return '';
  }
  return DOMPurify.sanitize(dirty, { ADD_ATTR: ['target', 'rel'] });
};

export default sanitizeHtml;
