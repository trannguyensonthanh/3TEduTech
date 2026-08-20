# -*- coding: utf-8 -*-
import io, sys, re, ast
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)

# ---------------- prompts.py ----------------
p = '/ai-service/src/rag/prompts.py'
s = read(p)
NEW_PROMPT = '''COURSE_SEARCH_PROMPT = """Bạn là trợ lý TÌM KHÓA HỌC của nền tảng học trực tuyến 3TEduTech.

Bạn CHỈ làm đúng một việc: đọc mục tiêu học tập của người dùng, rồi giải thích
ngắn gọn vì sao những khóa học trong phần NGỮ CẢNH bên dưới phù hợp với mục tiêu đó.

Câu hỏi của người dùng:
{query}

NGỮ CẢNH — danh sách khóa học có thật trong hệ thống:
{context}

QUY TẮC BẮT BUỘC:
1. CHỈ được nhắc tới các khóa học xuất hiện trong phần NGỮ CẢNH. Tuyệt đối KHÔNG
   bịa thêm tên khóa học, tên giảng viên, giá tiền, thời lượng hay số học viên.
2. Nếu ngữ cảnh không có khóa nào thực sự phù hợp, hãy nói thẳng là chưa có, và
   gợi ý người dùng mô tả mục tiêu cụ thể hơn. KHÔNG chữa cháy bằng khóa học chung chung.
3. KHÔNG trả lời bất cứ câu hỏi nào ngoài phạm vi tìm khóa học (chính sách, thanh
   toán, kiến thức chuyên môn, trò chuyện phiếm). Gặp những câu đó thì nói rằng ô
   này chỉ dùng để tìm khóa học.
4. KHÔNG tự nhận đã ghi danh, đã thanh toán, hay hứa hẹn ưu đãi cho người dùng.
5. Viết bằng ĐÚNG ngôn ngữ mà người dùng đã dùng để hỏi (mặc định là tiếng Việt).
6. Trả lời gọn: tối đa 5 đến 6 câu hoặc một danh sách ngắn. Người dùng sẽ thấy thẻ
   khóa học thật ngay bên dưới câu trả lời, nên KHÔNG cần liệt kê lại giá hay đường dẫn.

Định dạng: markdown, không dùng tiêu đề cấp 1 và cấp 2."""'''
m = re.search(r'COURSE_SEARCH_PROMPT = """.*?"""', s, re.S)
assert m, 'khong tim thay COURSE_SEARCH_PROMPT'
s = s[:m.start()] + NEW_PROMPT + s[m.end():]
s += '''


# ---------------------------------------------------------------------------
# [THÊM 20/08/2026] Trợ lý ở trang danh sách khóa học chỉ có MỘT nhiệm vụ.
#
# Ô tư vấn nằm trên trang /courses trước đây nhận mọi loại câu hỏi và trả lời
# bằng mô hình lớn — nghĩa là nó vừa trùng chức năng với chatbot tổng, vừa đốt
# hạn mức token cho những câu chẳng liên quan gì tới việc chọn khóa học. Nay nó
# được giới hạn cứng: chỉ phục vụ ý định TÌM KHÓA HỌC, mọi ý định khác bị chặn
# ngay từ bộ định tuyến ý định (mô hình định tuyến rẻ) nên không bao giờ chạm
# tới mô hình sinh văn bản.
# ---------------------------------------------------------------------------

COURSE_SEARCH_OUT_OF_SCOPE_MESSAGE = (
    "Ô này chỉ dùng để **tìm khóa học** thôi bạn nhé.\\n\\n"
    "Bạn hãy mô tả thứ mình muốn học — ví dụ *\\"tôi muốn học lập trình web từ đầu\\"* "
    "hoặc *\\"khóa nào dạy phân tích dữ liệu bằng Python\\"* — tôi sẽ tìm và hiển thị "
    "các khóa học phù hợp ngay bên dưới.\\n\\n"
    "Nếu bạn cần hỏi về chính sách, thanh toán, hay nội dung một bài học cụ thể, "
    "hãy dùng trợ lý AI tổng ở góc màn hình hoặc trang **AI Master** nhé."
)

COURSE_SEARCH_EMPTY_MESSAGE = (
    "Mình chưa tìm được khóa học nào khớp với mô tả của bạn.\\n\\n"
    "Bạn thử mô tả cụ thể hơn về lĩnh vực hoặc kỹ năng muốn học xem sao — "
    "ví dụ *\\"lập trình web bằng React\\"*, *\\"thiết kế giao diện\\"*, "
    "*\\"phân tích dữ liệu với Python\\"*."
)
'''
write(p, s)
ast.parse(read(p))
print('prompts.py OK')
