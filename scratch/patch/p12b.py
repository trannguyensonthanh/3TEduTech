# -*- coding: utf-8 -*-
import io, sys, re, ast
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/ai-service/src/api/routes/agent.py'
s = read(p)

# ---- 1. Bo nhanh "tin tuong dau hai cham" ----
OLD = """    # 1. Kiểm tra xem người dùng có chọn đích danh một khóa học từ nút UI (có dấu ':')
    is_explicit_selection = ":" in query and not query.strip().startswith("http")
"""
NEW = """    # [SỬA 20/08/2026] BỎ nhánh "tin tưởng dấu hai chấm".
    #
    # Bản cũ có:
    #     is_explicit_selection = ":" in query and not query.startswith("http")
    # và bước 3 dùng `if is_explicit_selection or exact_matched_course`. Nghĩa là
    # chỉ cần câu hỏi chứa một dấu hai chấm là toàn bộ cơ chế chống ảo giác ở
    # bước 2 bị bỏ qua: `verified_name` lấy nguyên văn phần sau dấu ':' mà KHÔNG
    # đối chiếu với dữ liệu thật, rồi mở thẻ thanh toán cho cái tên đó.
    #
    # Người dùng gõ "tôi muốn mua khóa: abc" sẽ thấy thẻ thanh toán cho một khóa
    # không tồn tại. Bấm nút đặt hàng, giao diện không tìm thấy tên khớp và
    # (trước khi vá widgets/index.tsx) rơi vào khóa đầu tiên trong danh mục —
    # tạo đơn rồi chuyển thẳng sang cổng thanh toán cho một khóa học khác hẳn.
    #
    # Ý định ban đầu của nhánh này là nhận diện cú bấm nút từ thẻ carousel, vì
    # nút đó gửi chuỗi dạng "Tôi muốn mua khóa học số 1: <Tên thật>". Nhưng tên
    # trong chuỗi ấy vốn lấy từ chính kết quả tra kho tri thức nên nó LUÔN khớp
    # ở bước 2. Bỏ nhánh tắt không làm hỏng luồng bấm nút, chỉ chặn đúng phần
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

# ---- 2. Chuyen tiep ui_widget vao chat_history (sua anh xa "khoa so N") ----
HIST_COMMENT = """# [SỬA 20/08/2026] Chuyển tiếp cả `ui_widget` của từng lượt.
#
# `_resolve_course_reference` có sẵn một nhánh đọc `ui_widget` của lượt trước để
# ánh xạ "khóa số 1 / số 2 / số 3" về đúng thẻ trong danh sách đã hiển thị.
# Nhưng nhánh đó CHƯA BAO GIỜ CHẠY: schema ChatHistoryPair chỉ có question và
# answer, và chính dòng dựng history còn tạo lại dict mới với đúng hai khóa đó.
# Việc ánh xạ vì thế rơi xuống nhánh dự phòng — bốc chuỗi in đậm thứ N trong câu
# trả lời trước — mà thứ tự chữ in đậm do mô hình tự viết, không liên quan gì
# tới thứ tự thẻ (thẻ xếp theo điểm RRF).
#
# Hệ quả: gợi ý có sẵn ngay trên màn hình ("Tôi muốn mua khóa học số 1 trong
# danh sách của bạn") thường mở thẻ thanh toán cho một khóa KHÁC với khóa số 1
# người dùng nhìn thấy."""

OLD_H = 'history = [{"question": h.question, "answer": h.answer} for h in request.chat_history]'
assert s.count(OLD_H) == 2, 'so lan xuat hien history khong phai 2'

def _replace_history(src):
    out = []
    for line in src.split('\n'):
        st = line.strip()
        if st == OLD_H:
            ind = line[:len(line) - len(line.lstrip())]
            for c in HIST_COMMENT.split('\n'):
                out.append(ind + c)
            out.append(ind + 'history = [')
            out.append(ind + '    {"question": h.question, "answer": h.answer, "ui_widget": h.ui_widget}')
            out.append(ind + '    for h in request.chat_history')
            out.append(ind + ']')
        else:
            out.append(line)
    return '\n'.join(out)

s = _replace_history(s)

# ---- 3. Tich luy cau tra loi de sinh goi y dung ngu canh ----
s = sub(s, """    async def event_generator():
        try:""",
"""    async def event_generator():
        /*PLACEHOLDER*/
        try:""", 'dau event_generator')
s = s.replace("""        /*PLACEHOLDER*/
""", """        # [THÊM 20/08/2026] Tích lũy phần chữ đã nhả ra, để sinh câu hỏi gợi ý
        # từ chính câu trả lời vừa nói. Bản cũ truyền một chuỗi cố định làm
        # `previous_response` nên gợi ý luôn được sinh từ một câu mô tả chung
        # chung và thường lạc đề. Đường không streaming vốn đã làm đúng.
        streamed_parts: list[str] = []

        def _token_event(text: str) -> str:
            streamed_parts.append(text)
            return f"event: token\\ndata: {json.dumps({'text': text}, ensure_ascii=False)}\\n\\n"

""")

# doi moi cho yield token trong event_generator sang _token_event
start = s.index('    async def event_generator():')
end = s.index('    return StreamingResponse(event_generator()')
body = s[start:end]
pat = re.compile(r'yield f"event: token\\ndata: \{json\.dumps\(\{\'text\': (.+?)\}, ensure_ascii=False\)\}\\n\\n"')
body_new, cnt = pat.subn(lambda m: 'yield _token_event(%s)' % m.group(1), body)
assert cnt >= 6, 'chi doi duoc %d cho yield token' % cnt
s = s[:start] + body_new + s[end:]

s = sub(s, """            suggestions = await generate_suggested_questions(
                previous_response="Hỏi đáp thông tin về khóa học tại 3TEduTech",
                original_query=request.query,
            )""",
"""            suggestions = await generate_suggested_questions(
                previous_response="".join(streamed_parts).strip()
                or "Hỏi đáp thông tin về khóa học tại 3TEduTech",
                original_query=request.query,
            )""", 'generate_suggested_questions streaming')

write(p, s)
ast.parse(read(p))
print('agent.py OK, doi %d cho yield token' % cnt)

# ---- 4. schemas.py: ChatHistoryPair co ui_widget ----
p = '/ai-service/src/models/schemas.py'
s = read(p)
s = sub(s, """class ChatHistoryPair(BaseModel):
    question: str
    answer: str""",
"""class ChatHistoryPair(BaseModel):
    question: str
    answer: str
    # [THÊM 20/08/2026] Thẻ giao diện mà lượt trả lời đó đã hiển thị.
    #
    # `_resolve_course_reference` trong agent.py cần trường này để ánh xạ "khóa
    # số 1 / số 2 / số 3" về đúng thẻ trong danh sách đã hiện ra. Thiếu nó, nhánh
    # ánh xạ chính xác là mã chết và hệ thống phải đoán bằng cách bốc chuỗi in
    # đậm thứ N trong câu trả lời trước — một phép đoán sai thường xuyên, và cái
    # sai đó dẫn thẳng tới thẻ thanh toán cho khóa học khác.
    #
    # Backend Node.js đã lưu sẵn cột UiWidgetJson cho từng tin nhắn nên chỉ cần
    # đọc lên và gửi kèm, không phát sinh truy vấn mới.
    ui_widget: dict | None = None""", 'ChatHistoryPair')
write(p, s)
ast.parse(read(p))
print('schemas.py OK')
