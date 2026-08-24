# -*- coding: utf-8 -*-
import io, sys, ast
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/ai-service/src/api/routes/generate.py'
s = read(p)

# 1. Request model
s = sub(s, """    questions_per_lesson: int = Field(default=3, ge=1, le=5)""",
"""    questions_per_lesson: int = Field(default=3, ge=1, le=5)
    #: [THÊM 20/08/2026] Mức độ khó của đề.
    #: Trước đây giảng viên không điều khiển được gì ngoài nút "soạn lại", nên
    #: một đề quá dễ (không phân loại được ai hiểu bài) hay quá khó (tỉ lệ đậu
    #: sụp, học viên bỏ ngang) đều chỉ còn cách bấm lại và cầu may.
    #: 'mixed' là mặc định vì nó an toàn khi giảng viên chưa có ý kiến.
    difficulty: str = Field(default="mixed", max_length=10)""", 'GenerateQuizRequest')

# 2. Bang mo ta do kho
s = sub(s, """_QUIZ_SYSTEM_PROMPT = \"\"\"\\""",
'''# [THÊM 20/08/2026] Diễn giải độ khó thành chỉ dẫn cụ thể.
#
# Truyền thẳng chữ "hard" vào prompt thì mỗi mô hình hiểu một kiểu, và cùng một
# mô hình cũng không nhất quán giữa các lần gọi. Mô tả bằng HÀNH VI ra đề —
# "hỏi vào định nghĩa" so với "hỏi vào tình huống áp dụng" — cho kết quả ổn
# định hơn nhiều so với một tính từ.
_DO_KHO = {
    "easy": (
        "MỨC DỄ: hỏi vào định nghĩa, thuật ngữ và sự kiện nêu thẳng trong bài. "
        "Đáp án đúng phải tìm được bằng cách đọc lại một câu trong tài liệu. "
        "Ba đáp án sai khác biệt rõ ràng với đáp án đúng."
    ),
    "medium": (
        "MỨC TRUNG BÌNH: hỏi vào mối liên hệ giữa các ý trong bài, hoặc yêu cầu "
        "chọn ví dụ đúng cho một khái niệm. Đáp án đúng cần hiểu bài chứ không "
        "chỉ đọc lại. Đáp án sai phải là những hiểu nhầm phổ biến."
    ),
    "hard": (
        "MỨC KHÓ: đặt một tình huống ngắn rồi hỏi cách áp dụng kiến thức trong "
        "bài để xử lý, hoặc hỏi vì sao một cách làm là sai. Các đáp án sai phải "
        "gần đúng, chỉ khác ở một chi tiết quyết định. TUYỆT ĐỐI không vì muốn "
        "khó mà hỏi kiến thức nằm ngoài bài học."
    ),
    "mixed": (
        "TRỘN BA MỨC: nếu ra 3 câu trở lên cho một bài, hãy để câu đầu ở mức dễ "
        "(định nghĩa, sự kiện nêu thẳng trong bài), các câu giữa ở mức trung "
        "bình (liên hệ giữa các ý), câu cuối ở mức khó (áp dụng vào một tình "
        "huống ngắn). Nếu chỉ ra 1-2 câu thì dùng mức trung bình."
    ),
}


_QUIZ_SYSTEM_PROMPT = """\\''', 'bang do kho')

# 3. Chen chi dan do kho vao prompt
s = sub(s, """8. Nếu một bài không đủ nội dung để ra đề, trả về mảng "questions" rỗng cho bài
   đó. Đừng cố bịa.""",
"""8. Nếu một bài không đủ nội dung để ra đề, trả về mảng "questions" rỗng cho bài
   đó. Đừng cố bịa.
9. Bám đúng mức độ khó được nêu ở phần "YÊU CẦU VỀ ĐỘ KHÓ" bên dưới phần dữ
   liệu. Mức độ khó KHÔNG được làm bạn đi ra ngoài nội dung bài học: kể cả mức
   khó nhất, mọi câu hỏi vẫn phải trả lời được chỉ bằng tài liệu đã cho.""", 'quy tac do kho')

write(p, s)
ast.parse(read(p))
print('generate.py phan 2 OK')
