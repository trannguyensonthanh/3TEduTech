# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)

# ================= courses.repository.js : thêm findPublishedCoursesByNames ==
p = '/3t-edu-tech-backend/src/api/courses/courses.repository.js'
s = read(p)
ANCHOR = '''/**
 * Cập nhật khóa học bằng ID.
 */
const updateCourseById'''
NEW_FN = '''/* ==========================================================================
 * [THÊM 20/08/2026] Tra khóa học theo DANH SÁCH TÊN — phục vụ trợ lý tìm kiếm
 * bằng AI ở trang /courses.
 *
 * VÌ SAO KHÔNG LẤY THẲNG DỮ LIỆU TỪ KHO VECTOR
 * Kho vector (ChromaDB) chỉ giữ đoạn văn bản mô tả và đúng hai trường siêu dữ
 * liệu: `type` và `course_name` (xem ai-service/src/rag/loader.py). Nó KHÔNG
 * giữ giá, ảnh bìa, xếp hạng, số học viên hay trạng thái xuất bản — và cũng
 * không nên giữ, vì bốn thứ đầu đổi hằng ngày còn thứ cuối quyết định khóa học
 * có được phép hiện ra hay không. Nếu dựng thẻ khóa học từ kho vector thì chỉ
 * cần một khóa bị gỡ xuất bản là nó vẫn tiếp tục hiện ra và bán được.
 *
 * Nên AI chỉ trả về TÊN, còn mọi thứ hiển thị đều lấy lại từ SQL Server ở đây,
 * kèm nguyên bộ điều kiện lọc của danh sách công khai: chỉ PUBLISHED, chỉ bản
 * mới nhất, và loại bản nháp đang soạn.
 *
 * So khớp bằng `=` chứ không phải `LIKE`: tên trả về từ kho vector vốn được
 * ghi vào chính từ cột CourseName lúc nạp tri thức, nên khớp tuyệt đối là đủ.
 * Dùng LIKE ở đây sẽ khiến "React" kéo theo mọi khóa có chữ React trong tên,
 * làm hỏng thứ hạng mà AI đã sắp.
 *
 * @param {string[]} names Danh sách tên khóa học, theo đúng thứ hạng AI trả về.
 * @returns {Promise<object[]>} Các bản ghi khóa học (PascalCase, như findAllCourses).
 * ========================================================================== */
const findPublishedCoursesByNames = async (names = []) => {
  const cleaned = [
    ...new Set(
      (names || [])
        .map((n) => String(n || '').trim())
        .filter((n) => n.length > 0)
    ),
  ].slice(0, 20); // chặn trên: AI không bao giờ trả nhiều hơn top_k, nhưng đầu vào từ dịch vụ ngoài thì luôn phải có giới hạn

  if (cleaned.length === 0) return [];

  try {
    const pool = await getConnection();
    const request = pool.request();

    // Tham số hóa từng tên một. Nối chuỗi vào câu lệnh ở đây là mở đường tiêm
    // SQL qua chính nội dung do mô hình ngôn ngữ sinh ra — nguồn dữ liệu ít
    // đáng tin nhất trong cả hệ thống.
    const params = cleaned.map((name, i) => {
      request.input(`Name${i}`, sql.NVarChar(500), name);
      return `@Name${i}`;
    });

    request.input('StatusID', sql.VarChar, CourseStatus.PUBLISHED);

    const result = await request.query(`
      SELECT
        c.CourseID, c.CourseName, c.Slug, c.ShortDescription, c.FullDescription,
        c.Requirements, c.LearningOutcomes, c.ThumbnailUrl, c.IntroVideoUrl,
        c.OriginalPrice, c.DiscountedPrice, c.Language, c.StatusID, c.PublishedAt,
        c.IsFeatured, c.CreatedAt, c.UpdatedAt, c.AverageRating, c.ReviewCount,
        cat.CategoryName, lvl.LevelName, cs.StatusName,
        up.AccountID AS InstructorAccountID,
        up.FullName  AS InstructorName,
        up.AvatarUrl AS InstructorAvatar,
        COUNT(e.EnrollmentID) AS StudentCount
      FROM Courses c
      JOIN Categories     cat ON c.CategoryID = cat.CategoryID
      JOIN Levels         lvl ON c.LevelID    = lvl.LevelID
      JOIN CourseStatuses cs  ON c.StatusID   = cs.StatusID
      JOIN UserProfiles   up  ON c.InstructorID = up.AccountID
      LEFT JOIN Enrollments e ON c.CourseID   = e.CourseID
      WHERE c.CourseName IN (${params.join(', ')})
        AND c.StatusID = @StatusID
        AND c.LiveCourseID IS NULL
        AND ISNULL(c.IsLatestVersion, 1) = 1
      GROUP BY
        c.CourseID, c.CourseName, c.Slug, c.ShortDescription, c.FullDescription,
        c.Requirements, c.LearningOutcomes, c.ThumbnailUrl, c.IntroVideoUrl,
        c.OriginalPrice, c.DiscountedPrice, c.Language, c.StatusID, c.PublishedAt,
        c.IsFeatured, c.CreatedAt, c.UpdatedAt, c.AverageRating, c.ReviewCount,
        cat.CategoryName, lvl.LevelName, cs.StatusName,
        up.AccountID, up.FullName, up.AvatarUrl;
    `);

    // SQL Server trả về theo thứ tự tùy ý. Sắp lại đúng thứ hạng mà AI đã xếp —
    // đó chính là phần giá trị của việc dùng tìm kiếm ngữ nghĩa; trả về theo
    // thứ tự ngẫu nhiên thì thà lọc bằng LIKE cho xong.
    const order = new Map(cleaned.map((n, i) => [n.toLowerCase(), i]));
    return result.recordset.sort(
      (a, b) =>
        (order.get(String(a.CourseName).toLowerCase()) ?? 999) -
        (order.get(String(b.CourseName).toLowerCase()) ?? 999)
    );
  } catch (error) {
    logger.error('Error in findPublishedCoursesByNames repository:', error);
    throw error;
  }
};

''' + ANCHOR

assert s.count(ANCHOR) == 1, 'khong tim thay neo updateCourseById'
s = s.replace(ANCHOR, NEW_FN)

OLD_EXP = "  findAllCourses,\n"
assert s.count(OLD_EXP) >= 1
s = s.replace("  findAllCourses,\n  updateCourseById,",
              "  findAllCourses,\n  findPublishedCoursesByNames,\n  updateCourseById,")
assert 'findPublishedCoursesByNames,\n  updateCourseById' in s, 'khong them duoc vao module.exports'
write(p, s)
print('courses.repository.js OK')
