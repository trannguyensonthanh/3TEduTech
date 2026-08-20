# -*- coding: utf-8 -*-
import io, sys, ast
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/ai-service/src/api/routes/agent.py'
s = read(p)

OLD = """    # 1. Kiểm tra xem người dùng có chọn đích danh một khóa học từ nút UI (có dấu ':')
    is_explicit_selection = ":" in query and not query.strip().startswith("http")
"""
NEW = """    # [SỬA 20/08/2026] BỎ nhánh "tin tưởng dấu hai chấm".
    #
    # Bản cũ có:
    #     is_explicit_selection = ":" in query and not query.startswith("http")
    # và ở bước 3 dùng `if is_explicit_selection or exact_matched_course`. Nghĩa
    # là chỉ cần câu hỏi chứa một dấu hai chấm là toàn bộ cơ chế chống ảo giác ở
    # bước 2 bị bỏ qua: `verified_name` lấy nguyên văn phần sau dấu ':' mà KHÔNG
    # hề đối chiếu với cơ sở dữ liệu, rồi mở thẻ thanh toán cho cái tên đó.
    #
    # Người dùng gõ "tôi muốn mua khóa: abc" sẽ thấy thẻ thanh toán cho khóa
    # "abc" không tồn tại. Bấm nút đặt hàng, giao diện không tìm thấy tên khớp
    # và (trước khi vá widgets/index.tsx) rơi vào khóa đầu tiên trong danh mục —
    # tạo đơn và chuyển thẳng sang cổng thanh toán cho một khóa học khác hẳn.
    #
    # Ý định ban đầu của nhánh này là nhận diện cú bấm nút từ thẻ carousel, vì
    # nút đó gửi chuỗi dạng "Tôi muốn mua khóa học số 1: <Tên thật>". Nhưng tên
    # trong chuỗi ấy vốn lấy từ chính kết quả tra kho tri thức, nên nó LUÔN khớp
    # ở bước 2. Bỏ nhánh tắt đi không làm hỏng luồng bấm nút, chỉ chặn đúng phần
    # người dùng tự gõ dấu hai chấm.
"""
s = sub(s, OLD, NEW, 'is_explicit_selection')

OLD2 = """    # 3. Nếu là click nút thanh toán tường minh hoặc tìm thấy tên khóa học thật chính xác trong hệ thống -> Mở thanh toán!
    if is_explicit_selection or exact_matched_course:
        verified_name = exact_matched_course if exact_matched_course else course_name
"""
NEW2 = """    # 3. CHỈ mở thẻ thanh toán khi tên khóa học đã được đối chiếu với dữ liệu
    #    thật trong hệ thống. Không khớp thì đi xuống nhánh 4 và hiển thị danh
    #    sách khóa học có thật để người dùng tự chọn.
    if exact_matched_course:
        verified_name = exact_matched_course
"""
s = sub(s, OLD2, NEW2, 'nhanh mo thanh toan')

# ---- L10: goi y cau hoi trong luong streaming ----
OLD3 = """        suggestions = await generate_suggested_questions(
            previous_response="Hỏi đáp thông tin về khóa học tại 3TEduTech",
            original_query=request.query,
        )"""
NEW3 = """        # [SỬA 20/08/2026] Sinh gợi ý từ CÂU TRẢ LỜI THẬT.
        #
        # Bản cũ truyền một chuỗi cố định ("Hỏi đáp thông tin về khóa học tại
        # 3TEduTech") làm `previous_response`, nên mọi câu hỏi gợi ý dưới mỗi
        # câu trả lời ở chế độ nhả chữ đều được sinh từ cùng một câu mô tả chung
        # chung — thường lạc hẳn khỏi nội dung vừa nói. Đường không streaming
        # (dòng phía trên trong tệp này) vốn đã truyền đúng `result["answer"]`.
        suggestions = await generate_suggested_questions(
            previous_response=(streamed_answer or "").strip()
            or "Hỏi đáp thông tin về khóa học tại 3TEduTech",
            original_query=request.query,
        )"""
s = sub(s, OLD3, NEW3, 'generate_suggested_questions streaming')

write(p, s)
ast.parse(read(p))
print('agent.py (phan 1) OK')
