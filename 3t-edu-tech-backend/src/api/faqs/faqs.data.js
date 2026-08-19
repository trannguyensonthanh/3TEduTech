/* ============================================================================
 * faqs.data.js
 * [THÊM 18/08/2026]
 *
 * Câu hỏi thường gặp + chính sách hệ thống, để CỨNG trong mã nguồn.
 *
 * ----------------------------------------------------------------------------
 * ★ VÌ SAO KHÔNG DÙNG BẢNG CSDL
 *
 * Nội dung này đổi vài tháng một lần. Một bảng riêng đổi lại được gì?
 *
 *   • Sửa không cần deploy — đúng, nhưng đổi lại phải nuôi thêm một bảng, một
 *     bộ CRUD, một màn hình quản trị, và một đường đồng bộ RAG nữa.
 *   • Có lịch sử sửa đổi — thực ra Git làm việc này TỐT HƠN: mỗi lần đổi chính
 *     sách đều có commit, có tác giả, có thời điểm, có diff, và revert được.
 *     Một bảng CSDL trần không có gì trong số đó trừ khi tự dựng bảng lịch sử.
 *
 * ----------------------------------------------------------------------------
 * ⚠️ NỘI DUNG NÀY ĐI THẲNG VÀO TRI THỨC CỦA CHATBOT
 *
 * `aiSync.service.js` nạp toàn bộ mảng dưới đây vào ChromaDB, và trợ lý AI sẽ
 * dựa vào đó để trả lời học viên về chính sách. Viết sai ở đây nghĩa là chatbot
 * nói sai chính sách với người dùng thật.
 *
 * Sửa xong nhớ khởi động lại backend — việc đồng bộ chạy lúc khởi động.
 * ========================================================================== */

/**
 * @typedef {object} Faq
 * @property {number} faqId    Định danh ổn định. ĐỪNG đánh số lại khi chèn câu
 *                             mới — id này đi vào `source_name` của ChromaDB
 *                             ("FAQ-3"), đổi số là sinh ra bản trùng trong RAG.
 * @property {string} question
 * @property {string} answer
 * @property {string} category
 * @property {number} sortOrder
 */

/** @type {Faq[]} */
const FAQS = [
  {
    faqId: 1,
    category: 'Tài khoản',
    sortOrder: 10,
    question: 'Làm sao để đăng ký tài khoản trên 3T EduTech?',
    answer:
      'Bấm "Đăng ký" ở góc trên bên phải, điền email và mật khẩu, sau đó xác nhận qua đường dẫn được gửi tới email của bạn. Bạn cũng có thể đăng nhập nhanh bằng tài khoản Google hoặc Facebook.',
  },
  {
    faqId: 2,
    category: 'Tài khoản',
    sortOrder: 20,
    question: 'Tôi quên mật khẩu thì làm thế nào?',
    answer:
      'Ở màn hình đăng nhập, bấm "Quên mật khẩu" và nhập email đã đăng ký. Chúng tôi gửi một đường dẫn đặt lại mật khẩu có hiệu lực trong thời gian ngắn. Nếu không thấy email, kiểm tra thư mục spam.',
  },
  {
    faqId: 3,
    category: 'Thanh toán',
    sortOrder: 30,
    question: 'Tôi có thể thanh toán khóa học bằng những hình thức nào?',
    answer:
      'Hệ thống hỗ trợ VNPay, MoMo, Stripe (thẻ quốc tế), PayPal và thanh toán bằng tiền mã hóa qua NOWPayments. Sau khi thanh toán thành công, khóa học được kích hoạt ngay trong mục "Khóa học của tôi".',
  },
  {
    faqId: 4,
    category: 'Thanh toán',
    sortOrder: 40,
    question: 'Chính sách hoàn tiền như thế nào?',
    answer:
      'Bạn có thể yêu cầu hoàn tiền trong vòng 7 ngày kể từ ngày thanh toán, với điều kiện đã học dưới 30% nội dung khóa học. Gửi yêu cầu qua mục Hỗ trợ kèm mã đơn hàng; chúng tôi xử lý trong 3–5 ngày làm việc.',
  },
  {
    faqId: 5,
    category: 'Chứng chỉ',
    sortOrder: 50,
    question: 'Khi nào tôi nhận được chứng chỉ hoàn thành?',
    answer:
      'Chứng chỉ được cấp tự động khi bạn hoàn thành 100% bài học của khóa. Chứng chỉ có mã xác minh riêng và có thể tra cứu công khai tại trang Xác minh chứng chỉ mà không cần đăng nhập.',
  },
  {
    faqId: 6,
    category: 'Chứng chỉ',
    sortOrder: 60,
    question: 'Chứng chỉ của tôi có thể bị thu hồi không?',
    answer:
      'Có. Chứng chỉ có thể bị thu hồi nếu phát hiện gian lận trong quá trình học hoặc làm bài kiểm tra. Chứng chỉ đã thu hồi sẽ hiển thị trạng thái "Đã thu hồi" khi tra cứu.',
  },
  {
    faqId: 7,
    category: 'Giảng viên',
    sortOrder: 70,
    question: 'Làm sao để trở thành giảng viên?',
    answer:
      'Vào mục "Đăng ký giảng viên", điền hồ sơ chuyên môn và tải lên giấy tờ chứng minh năng lực. Quản trị viên sẽ xét duyệt trong 3–7 ngày làm việc. Sau khi được duyệt, bạn có thể tạo và đăng bán khóa học.',
  },
  {
    faqId: 8,
    category: 'Giảng viên',
    sortOrder: 80,
    question: 'Khóa học của tôi có được duyệt ngay không?',
    answer:
      'Không. Mọi khóa học mới đều ở trạng thái NHÁP và phải qua bước duyệt của quản trị viên trước khi hiển thị công khai. Điều này áp dụng cho cả khóa học tạo thủ công lẫn khóa học nhập từ tệp ZIP.',
  },
  {
    faqId: 9,
    category: 'Giảng viên',
    sortOrder: 90,
    question: 'Tôi có thể nhập cả khóa học từ một tệp ZIP không?',
    answer:
      'Có. Vào "Khóa học của tôi" và bấm "Nhập Từ Tệp ZIP". Hệ thống đọc cây thư mục để dựng chương và bài học, đọc nội dung tài liệu, ghép phụ đề trùng tên với video, rồi đưa bản nháp cho bạn duyệt. Không có gì được lưu trước khi bạn đồng ý.',
  },
  {
    faqId: 10,
    category: 'Quyền riêng tư',
    sortOrder: 100,
    question: 'Dữ liệu cá nhân của tôi được bảo vệ ra sao?',
    answer:
      'Mật khẩu được băm bằng bcrypt và không bao giờ lưu ở dạng gốc. Dữ liệu học tập chỉ được dùng để cá nhân hóa trải nghiệm và không chia sẻ cho bên thứ ba vì mục đích quảng cáo. Bạn có quyền yêu cầu xóa tài khoản và dữ liệu liên quan.',
  },
  {
    faqId: 11,
    category: 'Trợ lý AI',
    sortOrder: 110,
    question: 'Trợ lý AI lấy thông tin từ đâu để trả lời tôi?',
    answer:
      'Trợ lý AI chỉ dựa trên nội dung khóa học đã xuất bản, các câu hỏi thường gặp và tài liệu chính sách do quản trị viên đăng tải trong hệ thống. Trợ lý có thể trả lời chưa chính xác trong một số trường hợp — với vấn đề quan trọng, vui lòng liên hệ bộ phận hỗ trợ để được xác nhận.',
  },
  {
    faqId: 12,
    category: 'Hỗ trợ',
    sortOrder: 120,
    question: 'Tôi liên hệ hỗ trợ bằng cách nào?',
    answer:
      'Dùng mục Hỗ trợ trong tài khoản, hoặc hỏi trực tiếp Trợ lý AI ở góc màn hình. Với vấn đề liên quan tới thanh toán, vui lòng kèm theo mã đơn hàng để được xử lý nhanh hơn.',
  },
];

/* Chặn lỗi trùng id ngay lúc nạp module thay vì để nó âm thầm sinh bản trùng
   trong ChromaDB. Hai FAQ cùng id nghĩa là cùng `source_name`, và lần nạp sau
   sẽ ghi đè lần trước — chatbot mất một câu mà không ai biết. */
const seenIds = new Set();
for (const faq of FAQS) {
  if (seenIds.has(faq.faqId)) {
    throw new Error(
      `faqs.data.js: faqId ${faq.faqId} bị trùng. Mỗi FAQ phải có id riêng.`
    );
  }
  seenIds.add(faq.faqId);
}

/** Danh sách đã sắp thứ tự hiển thị. */
const getAll = () =>
  [...FAQS].sort((a, b) => a.sortOrder - b.sortOrder || a.faqId - b.faqId);

const getById = (faqId) => FAQS.find((f) => f.faqId === Number(faqId)) || null;

/** Các nhóm hiện có, để giao diện dựng tab/mục lục mà không phải chép cứng. */
const getCategories = () => [...new Set(FAQS.map((f) => f.category))];

module.exports = { FAQS, getAll, getById, getCategories };
