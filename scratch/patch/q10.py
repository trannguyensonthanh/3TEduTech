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

# ---- 1. Response model: them requirements + learning_outcomes ----
s = sub(s, """class GenerateCourseResponse(BaseModel):
    short_description: str = ""
    full_description: str = ""
    sections: list[dict] = Field(default_factory=list)
    lessons: list[dict] = Field(default_factory=list)
    provider: str = ""
    warnings: list[str] = Field(default_factory=list)""",
"""class GenerateCourseResponse(BaseModel):
    short_description: str = ""
    full_description: str = ""
    # [THÊM 20/08/2026] Hai khối nội dung dưới đây trước nay AI không sinh, nên
    # cột Requirements và LearningOutcomes của khóa học nhập từ ZIP LUÔN rỗng —
    # trong khi "Bạn sẽ học được gì" là khối thuyết phục người mua mạnh nhất
    # trên trang bán khóa học. Trả về dạng HTML danh sách để khớp với trình soạn
    # thảo mà luồng tạo khóa học thủ công dùng.
    requirements: str = ""
    learning_outcomes: str = ""
    sections: list[dict] = Field(default_factory=list)
    lessons: list[dict] = Field(default_factory=list)
    provider: str = ""
    warnings: list[str] = Field(default_factory=list)""", 'GenerateCourseResponse')

# ---- 2. Prompt: yeu cau sinh them 2 truong ----
s = sub(s, """Nhiệm vụ: đọc cấu trúc một khóa học và viết mô tả cho khóa học, từng chương và
từng bài học.""",
"""Nhiệm vụ: đọc cấu trúc một khóa học và viết phần giới thiệu cho khóa học (mô tả
ngắn, mô tả đầy đủ, yêu cầu đầu vào, kết quả đạt được), cùng mô tả cho từng
chương và từng bài học.""", 'mo ta nhiem vu')

s = sub(s, """5. Độ dài: short_description tối đa 300 ký tự (một câu). full_description từ 2
   đến 4 đoạn. Mô tả chương 1-2 câu. Mô tả bài học 1-2 câu.
6. Giữ nguyên mọi giá trị "key" y hệt như trong dữ liệu đầu vào.""",
"""5. Độ dài: short_description tối đa 300 ký tự (một câu). full_description từ 2
   đến 4 đoạn. Mô tả chương 1-2 câu. Mô tả bài học 1-2 câu.
6. Giữ nguyên mọi giá trị "key" y hệt như trong dữ liệu đầu vào.
7. "requirements" là yêu cầu đầu vào của người học: kiến thức, kỹ năng hoặc
   công cụ cần có TRƯỚC khi bắt đầu. Từ 3 đến 5 mục. Nếu nội dung cho thấy khóa
   học dành cho người mới hoàn toàn thì nói thẳng là không cần kiến thức nền.
8. "learning_outcomes" là những gì người học LÀM ĐƯỢC sau khóa học. Từ 4 đến 6
   mục, mỗi mục bắt đầu bằng một động từ hành động (ví dụ: "Xây dựng...",
   "Triển khai...", "Phân tích..."). Không viết chung chung kiểu "hiểu rõ về X".
9. Cả "requirements" và "learning_outcomes" trả về dưới dạng HTML danh sách:
   <ul><li>...</li><li>...</li></ul>. Không dùng thẻ nào khác ngoài ul và li.""", 'quy tac')

s = sub(s, """{
  "short_description": "...",
  "full_description": "...",
  "sections": [{"key": "s0", "description": "..."}],
  "lessons": [{"key": "l0", "description": "..."}]
}\"\"\"""",
"""{
  "short_description": "...",
  "full_description": "...",
  "requirements": "<ul><li>...</li></ul>",
  "learning_outcomes": "<ul><li>...</li></ul>",
  "sections": [{"key": "s0", "description": "..."}],
  "lessons": [{"key": "l0", "description": "..."}]
}\"\"\"""", 'dinh dang tra ve')

# ---- 3. Handler: doc 2 truong moi ----
s = sub(s, """    result = GenerateCourseResponse(
        short_description=_clean_text(parsed.get("short_description"), 500),
        full_description=_clean_text(parsed.get("full_description"), 20000),
        sections=_collect_keyed(parsed.get("sections"), section_keys, 4000),""",
"""    result = GenerateCourseResponse(
        short_description=_clean_text(parsed.get("short_description"), 500),
        full_description=_clean_text(parsed.get("full_description"), 20000),
        requirements=_clean_html_list(parsed.get("requirements"), 5000),
        learning_outcomes=_clean_html_list(parsed.get("learning_outcomes"), 5000),
        sections=_collect_keyed(parsed.get("sections"), section_keys, 4000),""", 'handler')

# ---- 4. Ham lam sach HTML danh sach ----
s = sub(s, """def _collect_keyed(items, allowed_keys: set[str], max_chars: int) -> list[dict]:""",
'''def _clean_html_list(value, max_chars: int) -> str:
    """Giữ lại một danh sách HTML tối giản, loại mọi thẻ khác.

    ★ Vì sao không dùng thẳng `_clean_text`: hai trường "yêu cầu đầu vào" và
    "kết quả đạt được" được hiển thị bằng `dangerouslySetInnerHTML` ở trang chi
    tiết khóa học, đúng như hai trường tương ứng mà giảng viên tự soạn bằng
    trình soạn thảo. Nghĩa là bất cứ thẻ nào lọt qua đây đều được trình duyệt
    thực thi — và nguồn của chuỗi này là một mô hình ngôn ngữ đọc tài liệu do
    người ngoài tải lên.

    Nên ở đây dùng danh sách CHO PHÉP thay vì danh sách CẤM: chỉ <ul>, <ol> và
    <li> được giữ, mọi thứ còn lại bị gỡ thẻ (nội dung chữ vẫn giữ). Danh sách
    cấm luôn thiếu một mục nào đó; danh sách cho phép thì không.
    """
    if not isinstance(value, str):
        return ""

    text = value.strip()
    if not text:
        return ""

    # Gỡ trọn khối script/style kể cả nội dung bên trong — gỡ mỗi thẻ mở/đóng
    # thì phần mã bên trong sẽ lộ ra thành chữ.
    text = re.sub(
        r"<(script|style)\\b[^>]*>.*?</\\1\\s*>", "", text, flags=re.I | re.S
    )
    # Giữ ul/ol/li, gỡ thẻ của mọi phần tử khác (nội dung chữ vẫn còn).
    text = re.sub(r"</?(?!(?:ul|ol|li)\\b)[a-zA-Z][^>]*>", "", text)
    # Gỡ mọi thuộc tính khỏi ba thẻ được giữ: `<li onclick=...>` vẫn nguy hiểm.
    text = re.sub(r"<(ul|ol|li)\\b[^>]*>", r"<\\1>", text, flags=re.I)
    text = re.sub(r"\\s+", " ", text).strip()

    if not text:
        return ""

    # Mô hình đôi khi trả về văn bản thuần dù prompt yêu cầu HTML. Bọc lại
    # thành danh sách thay vì vứt đi — nội dung vẫn dùng được.
    if "<li>" not in text.lower():
        muc = [
            d.strip(" -•\\t")
            for d in re.split(r"[\\n;]|(?<=[.!?])\\s+(?=[A-ZĐÀ-Ỹ])", value)
            if d.strip(" -•\\t")
        ]
        if not muc:
            return ""
        text = "<ul>" + "".join(f"<li>{_clean_text(m, 300)}</li>" for m in muc[:8]) + "</ul>"

    return text[:max_chars]


def _collect_keyed(items, allowed_keys: set[str], max_chars: int) -> list[dict]:''', 'them _clean_html_list')

write(p, s)
ast.parse(read(p))
print('generate.py phan 1 OK')
