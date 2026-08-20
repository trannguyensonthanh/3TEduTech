# -*- coding: utf-8 -*-
import io, sys, ast
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

# ---------- schemas.py ----------
p = '/ai-service/src/models/schemas.py'
s = read(p)
s = sub(s, '''class IngestCourseRequest(BaseModel):
    """Request body for ingesting course content."""
    course_name: str = Field(..., description="Course name")
    course_description: str = Field(default="", description="Course description/overview")
    lessons: list[dict] = Field(default=[], description="List of lessons with 'name' and 'content'")''',
'''class IngestCourseRequest(BaseModel):
    """Request body for ingesting course content."""
    course_name: str = Field(..., description="Course name")
    course_description: str = Field(default="", description="Course description/overview")
    lessons: list[dict] = Field(default=[], description="List of lessons with 'name' and 'content'")
    # [THÊM 20/08/2026] Bốn trường định danh dưới đây backend VỐN ĐÃ GỬI LÊN
    # (xem aiSync.service.js) nhưng Pydantic lược bỏ im lặng vì schema không
    # khai báo. Hệ quả dây chuyền:
    #   - metadata trong ChromaDB chỉ có `type` và `course_name`;
    #   - agent.py đọc `meta.get("price", 0)` nên thẻ khóa học trong khung chat
    #     KHÔNG BAO GIỜ hiện giá (luôn rơi về nhãn "Học liệu đề xuất");
    #   - `courseId`/`slug` luôn null nên nút "Xem chi tiết" luôn rơi về trang
    #     tìm kiếm thay vì mở thẳng khóa học, và việc bỏ trùng phải so khớp
    #     bằng tên;
    #   - tính năng lọc theo phiên bản khóa học mà chú thích aiSync hứa hẹn
    #     thực tế chưa hề tồn tại.
    course_id: int | None = Field(default=None, description="CourseID trong SQL Server")
    slug: str | None = Field(default=None, description="Slug dùng để mở trang khóa học")
    price: float | None = Field(default=None, description="Giá hiển thị (tiền cơ sở)")
    version_number: int | None = Field(default=None, description="Số hiệu phiên bản khóa học")''',
'IngestCourseRequest')
write(p, s)
ast.parse(read(p)); print('schemas.py OK')

# ---------- loader.py ----------
p = '/ai-service/src/rag/loader.py'
s = read(p)
s = sub(s, '''async def ingest_course_content(
    course_name: str,
    course_description: str,
    lessons: list[dict],
    collection_name: str | None = None,
) -> int:''',
'''async def ingest_course_content(
    course_name: str,
    course_description: str,
    lessons: list[dict],
    collection_name: str | None = None,
    course_id: int | None = None,
    slug: str | None = None,
    price: float | None = None,
    version_number: int | None = None,
) -> int:''', 'chu ky ingest_course_content')

s = sub(s, '''    settings = get_settings()
    target_collection = collection_name or settings.chroma_collection_courses

    total_chunks = 0

    # Ingest course overview
    if course_description:
        overview = f"Course: {course_name}\\n\\n{course_description}"
        count = await ingest_text(
            overview,
            f"course_overview_{course_name}",
            target_collection,
            {"type": "course_overview", "course_name": course_name},
        )
        total_chunks += count''',
'''    settings = get_settings()
    target_collection = collection_name or settings.chroma_collection_courses

    total_chunks = 0

    # [THÊM 20/08/2026] Siêu dữ liệu định danh, gắn vào MỌI đoạn của khóa học.
    #
    # ChromaDB chỉ nhận giá trị vô hướng trong metadata, nên phải loại bỏ các
    # trường None thay vì gửi lên rồi để thư viện ném lỗi giữa chừng và làm hỏng
    # cả lượt nạp. Bỏ hẳn một trường an toàn hơn: nơi đọc đều dùng `.get()` kèm
    # giá trị mặc định.
    identity = {
        k: v
        for k, v in {
            "course_id": course_id,
            "slug": slug,
            "price": price,
            "version_number": version_number,
        }.items()
        if v is not None
    }

    # Ingest course overview
    if course_description:
        overview = f"Course: {course_name}\\n\\n{course_description}"
        count = await ingest_text(
            overview,
            f"course_overview_{course_name}",
            target_collection,
            {"type": "course_overview", "course_name": course_name, **identity},
        )
        total_chunks += count''', 'khoi overview')

s = sub(s, '''            {
                "type": "lesson",
                "course_name": course_name,
                "lesson_name": lesson_name,
            },''',
'''            {
                "type": "lesson",
                "course_name": course_name,
                "lesson_name": lesson_name,
                **identity,
            },''', 'metadata lesson')
write(p, s)
ast.parse(read(p)); print('loader.py OK')

# ---------- ingest.py ----------
p = '/ai-service/src/api/routes/ingest.py'
s = read(p)
s = sub(s, '''        chunks = await ingest_course_content(
            course_name=request.course_name,
            course_description=request.course_description,
            lessons=request.lessons,
        )''',
'''        chunks = await ingest_course_content(
            course_name=request.course_name,
            course_description=request.course_description,
            lessons=request.lessons,
            # [THÊM 20/08/2026] Chuyển tiếp bốn trường định danh xuống metadata.
            # Backend đã gửi lên từ lâu; trước đây chúng bị lược bỏ ở tầng schema.
            course_id=request.course_id,
            slug=request.slug,
            price=request.price,
            version_number=request.version_number,
        )''', 'goi ingest_course_content')
write(p, s)
ast.parse(read(p)); print('ingest.py OK')

# ---------- aiSync.service.js: gui them slug + price ----------
p = '/3t-edu-tech-backend/src/services/aiSync.service.js'
s = read(p)
s = sub(s, """        `SELECT CourseID, CourseName, ShortDescription, FullDescription,
                OriginalPrice, DiscountedPrice,
                ISNULL(VersionNumber, 1) AS VersionNumber
         FROM Courses""",
"""        `SELECT CourseID, CourseName, Slug, ShortDescription, FullDescription,
                OriginalPrice, DiscountedPrice,
                ISNULL(VersionNumber, 1) AS VersionNumber
         FROM Courses""", 'truy van khoa hoc')
s = sub(s, """            course_id: c.CourseID,
            version_number: c.VersionNumber,""",
"""            course_id: c.CourseID,
            version_number: c.VersionNumber,
            /* [THÊM 20/08/2026] Thêm slug và giá.
               Thẻ khóa học trong khung chat đọc `slug` để mở thẳng trang khóa
               học (thiếu thì nút "Xem chi tiết" chỉ đổ tên xuống ô tìm kiếm) và
               đọc `price` để hiện giá (thiếu thì luôn rơi về nhãn chung chung).
               Giá ở đây là ảnh chụp tại thời điểm nạp tri thức, dùng để HIỂN
               THỊ GỢI Ý; mọi lệnh tạo đơn vẫn lấy giá từ CSDL. */
            slug: c.Slug,
            price: Number(c.DiscountedPrice ?? c.OriginalPrice ?? 0),""", 'payload ingest')
write(p, s)
print('aiSync.service.js OK')
