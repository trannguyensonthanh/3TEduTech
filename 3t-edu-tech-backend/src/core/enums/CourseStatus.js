/**
 * Các trạng thái vòng đời của một khóa học.
 * Giá trị phải khớp chính xác với bảng tra cứu dbo.CourseStatuses trong DB.
 *
 * ⚠️ GIỮ OBJECT NÀY THUẦN CHUỖI — không thêm mảng hay hàm vào đây.
 * Lý do: courses.validation.js:54 dùng `Joi.string().valid(...Object.values(CourseStatus), 'ALL')`.
 * Nếu chèn thêm giá trị không phải chuỗi, chúng sẽ bị spread vào Joi và làm
 * hỏng toàn bộ ràng buộc validation của tham số statusId.
 */
const CourseStatus = Object.freeze({
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',

  /**
   * [THÊM 17/08/2026 — Course Versioning]
   * Phiên bản cũ đã được thay thế bởi một phiên bản mới hơn.
   *
   * Phân biệt với ARCHIVED:
   *   SUPERSEDED = tự động chuyển sang khi Admin duyệt phiên bản kế tiếp
   *   ARCHIVED   = giảng viên CHỦ ĐỘNG xin ngừng xuất bản (qua ARCHIVE_SUBMISSION)
   *
   * Cả hai đều KHÔNG còn bán ra, nhưng học viên đã mua vẫn giữ nguyên quyền
   * truy cập và toàn bộ tiến độ học. Tách riêng hai trạng thái giúp truy vết
   * được vì sao một khóa học ngừng bán — chúng đến từ hai luồng khác hẳn nhau.
   *
   * ⚠️ Yêu cầu đã chạy migration V5__course_versioning.sql (bổ sung dòng
   * SUPERSEDED vào bảng CourseStatuses), nếu không mọi lệnh gán trạng thái này
   * sẽ vi phạm khóa ngoại FK_Courses_StatusID.
   */
  SUPERSEDED: 'SUPERSEDED',

  ARCHIVED: 'ARCHIVED',
});

module.exports = CourseStatus;
