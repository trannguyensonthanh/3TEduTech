# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)

# ======================= chat.service.js =======================
p = '/3t-edu-tech-backend/src/api/ai/chat.service.js'
s = read(p)

# 1) import pricingUtil
OLD = "const { toCamelCaseObject } = require('../../utils/caseConverter');"
NEW = ("const pricingUtil = require('../../utils/pricing.util');\n"
       "const { toCamelCaseObject } = require('../../utils/caseConverter');")
assert s.count(OLD) == 1
s = s.replace(OLD, NEW)

# 2) streamMessage: chặn scope không phải MASTER
OLD_STREAM = """const streamMessage = async (user, sessionId, body, res) => {
  const session = await getOwnedSession(user, sessionId);
  const query = String(body.query || '').trim();"""
NEW_STREAM = """const streamMessage = async (user, sessionId, body, res) => {
  const session = await getOwnedSession(user, sessionId);

  /* [THÊM 20/08/2026] Chặn phiên không phải MASTER.
     Hàm này gọi thẳng `postAgentActionStream`, tức endpoint của tác tử bán
     hàng, không hề nhìn tới `session.Scope` — khác hẳn `sendMessage` phía trên
     vốn phân nhánh MASTER / COURSE đàng hoàng. Nếu ai đó gọi endpoint streaming
     với một phiên COURSE, câu hỏi về bài giảng sẽ đi qua tác tử bán hàng: mất
     hoàn toàn phần truy hồi theo `course_name`, và trợ lý trong khóa học có thể
     trả về thẻ chào mời mua khóa học khác.

     Hiện chưa lộ ra vì AIAssistantDialog đặt `useStreaming: false`, nhưng đó là
     một cái bẫy đặt sẵn cho lần bật streaming tiếp theo. AI Service chưa có
     endpoint `course-query-stream`, nên chặn rõ ràng ở đây là đúng hơn là im
     lặng trả lời sai. */
  if (session.Scope !== 'MASTER') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Phiên trò chuyện trong khóa học chưa hỗ trợ chế độ nhả chữ theo thời gian thực. Hãy dùng POST /chat thay cho /chat/stream.'
    );
  }

  const query = String(body.query || '').trim();"""
assert s.count(OLD_STREAM) == 1, 'khong tim thay dau streamMessage'
s = s.replace(OLD_STREAM, NEW_STREAM)

# 3) searchCourses: viết lại
OLD_SEARCH = """/** Tìm kiếm khóa học bằng AI (không lưu vào lịch sử — đây là tra cứu, không phải hội thoại). */
const searchCourses = async (payload) => {
  try {
    const response = await aiClient.postCourseSearch(payload);
    return response.data;
  } catch (error) {
    logger.error(`[AI Chat] Tìm kiếm AI lỗi: ${error.message}`);
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Dịch vụ tìm kiếm AI tạm thời không phản hồi.'
    );
  }
};"""
NEW_SEARCH = """/* ==========================================================================
 * TRỢ LÝ TÌM KHÓA HỌC (trang /courses)
 * [VIẾT LẠI 20/08/2026]
 *
 * Không lưu vào lịch sử hội thoại — đây là tra cứu, không phải trò chuyện.
 *
 * Hai việc hàm này làm thêm so với bản cũ:
 *
 * 1. ĐỐI CHIẾU TÊN KHÓA HỌC VỚI CƠ SỞ DỮ LIỆU rồi trả về THẺ KHÓA HỌC THẬT.
 *    Bản cũ trả thẳng `sources` của kho vector cho giao diện — mỗi mục chỉ có
 *    tên khóa và 200 ký tự mô tả, không có giá, ảnh bìa, xếp hạng hay đường
 *    dẫn. Người dùng thấy AI "tìm được khóa học" nhưng không bấm vào đâu được;
 *    bấm vào tên thì chỉ đổ chữ đó xuống ô tìm kiếm thường.
 *
 *    Nay AI chỉ trả về TÊN, còn dữ liệu hiển thị lấy lại từ SQL Server qua
 *    `findPublishedCoursesByNames`. Cách này còn bịt luôn một lỗ: kho vector
 *    không biết khóa học nào đã bị gỡ xuất bản, nên nếu dựng thẻ từ kho vector
 *    thì khóa đã gỡ vẫn hiện ra và vẫn bán được.
 *
 * 2. GẮN GIÁ THEO ĐÚNG LOẠI TIỀN người dùng đang xem, dùng đúng
 *    `pricingUtil.createPricingObject` mà danh sách khóa học công khai dùng —
 *    nên thẻ trả về ở đây có hình dạng giống hệt `CourseListItem`, giao diện
 *    dựng lại được bằng chính component thẻ khóa học sẵn có.
 *
 * @param {object} payload - { query, top_k }
 * @param {string} targetCurrency - 'VND' | 'USD', lấy từ req.targetCurrency
 * ========================================================================== */
const searchCourses = async (payload, targetCurrency = 'VND') => {
  let data;
  try {
    const response = await aiClient.postCourseSearch(payload);
    data = response.data || {};
  } catch (error) {
    logger.error(`[AI Chat] Tìm kiếm AI lỗi: ${error.message}`);
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Dịch vụ tìm kiếm AI tạm thời không phản hồi.'
    );
  }

  const base = {
    answer: data.answer || '',
    sources: data.sources || [],
    outOfScope: Boolean(data.out_of_scope),
    intent: data.intent || null,
    courses: [],
  };

  // Câu hỏi bị hàng rào ý định chặn thì không có gì để tra — trả về ngay.
  if (base.outOfScope) return base;

  const names = Array.isArray(data.matched_courses) ? data.matched_courses : [];
  if (names.length === 0) return base;

  try {
    const rows = await courseRepository.findPublishedCoursesByNames(names);
    base.courses = await Promise.all(
      rows.map(async (course) => {
        const pricing = await pricingUtil.createPricingObject(
          course,
          targetCurrency
        );
        const camel = toCamelCaseObject(course);
        // Bỏ hai cột giá thô đi cho khớp với hình dạng mà danh sách khóa học
        // công khai trả về: giao diện chỉ được đọc giá qua `pricing`, để mọi
        // chỗ hiển thị tiền đều đi qua một đường quy đổi duy nhất.
        delete camel.originalPrice;
        delete camel.discountedPrice;
        return { ...camel, pricing };
      })
    );
  } catch (error) {
    /* Tra cứu CSDL hỏng thì VẪN TRẢ câu trả lời của AI, chỉ thiếu phần thẻ.
       Ném lỗi ở đây nghĩa là một sự cố ở bước làm đẹp kết quả sẽ xóa sạch cả
       phần nội dung đã tốn tiền gọi mô hình để sinh ra. */
    logger.error(
      `[AI Chat] Không tra được khóa học từ CSDL sau khi tìm bằng AI: ${error.message}`
    );
  }

  return base;
};"""
assert s.count(OLD_SEARCH) == 1, 'khong tim thay searchCourses'
s = s.replace(OLD_SEARCH, NEW_SEARCH)
write(p, s)
print('chat.service.js OK')

# ======================= chat.controller.js =======================
p = '/3t-edu-tech-backend/src/api/ai/chat.controller.js'
s = read(p)
OLD_C = """/** POST /v1/ai/search-courses — tìm khóa học bằng AI. */
const searchCourses = catchAsync(async (req, res) => {
  const result = await chatService.searchCourses({
    query: req.body.query,
    top_k: req.body.topK || 5,
  });
  res.status(httpStatus.OK).send(result);
});"""
NEW_C = """/**
 * POST /v1/ai/search-courses — trợ lý tìm khóa học của trang /courses.
 *
 * [SỬA 20/08/2026] Truyền thêm `req.targetCurrency` để thẻ khóa học trả về có
 * giá theo đúng loại tiền người dùng đang xem — cùng cơ chế với danh sách khóa
 * học công khai. Thiếu tham số này thì giá luôn hiện bằng tiền cơ sở, và người
 * đang xem bằng USD sẽ thấy con số VND mà không hay biết.
 */
const searchCourses = catchAsync(async (req, res) => {
  const result = await chatService.searchCourses(
    {
      query: req.body.query,
      top_k: req.body.topK || 5,
    },
    req.targetCurrency
  );
  res.status(httpStatus.OK).send(result);
});"""
assert s.count(OLD_C) == 1, 'khong tim thay controller searchCourses'
write(p, s.replace(OLD_C, NEW_C))
print('chat.controller.js OK')
