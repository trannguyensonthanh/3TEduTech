# Phần 5 — Giải trình lựa chọn hệ quản trị CSDL: SQL Server và PostgreSQL

> Mục 2.5 của kế hoạch Level 2. Phần này viết để đưa thẳng vào báo cáo đồ án,
> trả lời câu hỏi thường gặp nhất khi bảo vệ: *"Sao không dùng PostgreSQL?"*

---

## 5.1. Hiện trạng

Hệ thống 3T EduTech đang chạy trên **Microsoft SQL Server 2019** (AWS RDS),
với 30 bảng nghiệp vụ và khoảng 200 câu truy vấn T-SQL viết tay trong tầng
repository. Toàn bộ truy cập dữ liệu đi qua driver `mssql` của Node.js, không
dùng ORM.

Việc **không dùng ORM** là điểm mấu chốt của cả phần giải trình này, nên cần
nói rõ ngay: nếu dự án dùng Prisma hay Sequelize, đổi hệ quản trị chỉ là sửa
một dòng `provider` trong file cấu hình. Vì truy vấn được viết tay bằng T-SQL,
chi phí chuyển đổi tỉ lệ thuận với số câu truy vấn chứ không phải với số bảng.

---

## 5.2. Vì sao ban đầu chọn SQL Server

| Lý do | Nội dung |
|---|---|
| Môi trường học tập | Nhóm đã học SQL Server ở học phần CSDL; công cụ SSMS quen thuộc, rút ngắn thời gian làm quen |
| Kiểu dữ liệu phù hợp | `NVARCHAR` lưu tiếng Việt có dấu chuẩn UTF-16 ngay từ đầu, không phải cấu hình encoding |
| `IDENTITY(1,1)` + `OUTPUT INSERTED.*` | Cho phép chèn và lấy lại bản ghi vừa tạo trong **một lượt đi về CSDL** — dự án dùng mẫu này ở hơn 20 chỗ |
| Sẵn trên AWS RDS | Không phải tự vận hành máy chủ CSDL |

---

## 5.3. PostgreSQL thực sự hơn ở điểm nào

Cần thẳng thắn: xét thuần kỹ thuật, PostgreSQL **có** những ưu thế rõ ràng cho
đúng bài toán của hệ thống này.

| Tiêu chí | PostgreSQL | SQL Server | Ý nghĩa với dự án |
|---|---|---|---|
| Chi phí bản quyền | Mã nguồn mở, miễn phí | Standard Edition tính theo lõi CPU | Trên RDS, `db.t3.medium` chạy SQL Server đắt hơn PostgreSQL cùng cấu hình khoảng **2,5–3 lần** |
| Kiểu `JSONB` | Hỗ trợ gốc, đánh chỉ mục GIN được | `NVARCHAR(MAX)` + `JSON_VALUE`, không index nội dung | Rất hợp với `VersionNotes`, log kiểm toán, và **lịch sử chat AI** ở Level 3 |
| Tìm kiếm toàn văn | `tsvector` + `pg_trgm` sẵn trong lõi | Full-Text Search phải cài thêm thành phần | Tìm kiếm khóa học tiếng Việt sẽ tốt hơn |
| Tìm kiếm vector | `pgvector` — có thể gộp ChromaDB vào thẳng CSDL chính | Không có tương đương | Đúng hướng đi của hệ thống RAG hiện tại |
| Chỉ mục một phần | Có, cú pháp `WHERE` | Có (filtered index) | Hòa |
| Hệ sinh thái container | Ảnh Docker chính thức nhẹ, khởi động vài giây | Ảnh nặng hơn nhiều, cần chấp nhận EULA | Môi trường dev dựng nhanh hơn |

**Kết luận trung thực:** nếu được làm lại từ đầu ngày hôm nay, PostgreSQL là
lựa chọn hợp lý hơn — chủ yếu vì chi phí và vì `pgvector` khớp với hướng AI mà
hệ thống đang đi.

---

## 5.4. Vì sao vẫn KHÔNG chuyển ở giai đoạn này

Quyết định giữ SQL Server không đến từ việc nó tốt hơn, mà từ **thời điểm**.

### 5.4.1. Khối lượng công việc thật

Không phải "đổi chuỗi kết nối". Cụ thể phải sửa:

| Hạng mục | Số chỗ (ước lượng) | Ghi chú |
|---|---|---|
| `OUTPUT INSERTED.*` → `RETURNING *` | ~25 | Cú pháp khác hoàn toàn |
| `OFFSET n ROWS FETCH NEXT m ROWS ONLY` → `LIMIT/OFFSET` | ~30 | Mọi API có phân trang |
| `ISNULL()` → `COALESCE()` | ~120 | |
| `GETDATE()` → `NOW()` | ~60 | |
| `NVARCHAR`/`BIGINT IDENTITY` → `TEXT`/`BIGSERIAL` | 30 bảng | Viết lại toàn bộ DDL |
| Tham số `@Name` → `$1, $2...` | ~200 câu | `mssql` dùng tham số đặt tên, `pg` dùng thứ tự — **không ánh xạ máy móc được** |
| `TOP 1` → `LIMIT 1` | ~15 | |
| Phân biệt HOA/thường của định danh | Toàn bộ | PostgreSQL hạ chữ thường mọi định danh không đặt trong nháy kép; `CourseID` thành `courseid`, làm vỡ **toàn bộ** hàm `toCamelCaseObject` |

Riêng dòng cuối là cái bẫy đáng sợ nhất và ít người lường trước: nó không gây
lỗi biên dịch, không gây lỗi SQL — chỉ khiến mọi trường trả về đổi tên, và bug
xuất hiện rải rác ở giao diện dưới dạng "chỗ này bị undefined".

**Ước lượng: 3–5 ngày làm việc toàn thời gian**, cộng thời gian kiểm thử lại
toàn bộ. Đây là công việc **không tạo ra một tính năng mới nào** cho người dùng.

### 5.4.2. Rủi ro so với lợi ích, ở đúng thời điểm này

Đồ án đang cần bổ sung các chức năng theo đề cương: chứng chỉ, realtime, lịch
sử chat, báo cáo thống kê. Bỏ 3–5 ngày để đổi hệ quản trị nghĩa là:

- Rủi ro cao: 200 câu truy vấn viết lại tay, mỗi câu là một khả năng sai sót.
- Lợi ích cho người chấm: **bằng không** — chức năng không đổi, giao diện không
  đổi, hiệu năng ở quy mô đồ án không đổi.
- Chi phí bản quyền — lợi thế lớn nhất của PostgreSQL — chỉ có ý nghĩa khi vận
  hành thật, chưa phải bây giờ.

### 5.4.3. Nguyên tắc kỹ thuật áp dụng

> **Không tái cấu trúc hạ tầng khi chưa có vấn đề thực tế cần giải quyết.**

Hiện chưa có: chưa gặp nút thắt hiệu năng, chưa chạm giới hạn nào của SQL
Server, chưa phải trả tiền bản quyền.

---

## 5.5. Điều kiện để chuyển sang PostgreSQL

Ghi rõ ở đây để quyết định "giữ SQL Server" là một lựa chọn có điều kiện, chứ
không phải né tránh. **Nên chuyển khi xảy ra ít nhất một trong các mốc sau:**

1. **Đưa vào vận hành thật có doanh thu** — lúc đó chênh lệch 2,5–3 lần chi phí
   RDS mỗi tháng trở thành con số đáng kể.
2. **Gộp ChromaDB vào CSDL chính** — nếu quyết định dùng `pgvector` để bớt một
   thành phần phải vận hành, việc chuyển trở nên bắt buộc.
3. **Lịch sử chat AI vượt vài triệu bản ghi** — `JSONB` + chỉ mục GIN xử lý dữ
   liệu bán cấu trúc tốt hơn hẳn `NVARCHAR(MAX)`.
4. **Chuyển sang ORM** (Prisma / Drizzle) — sau bước này, chi phí đổi hệ quản
   trị giảm gần như bằng không, và nên làm bước ORM TRƯỚC.

**Thứ tự đúng nếu sau này thực sự chuyển:**

```
Bước 1: Đưa tầng repository về sau một interface thống nhất
Bước 2: Chuyển dần sang ORM, giữ nguyên SQL Server
Bước 3: Đổi provider của ORM sang PostgreSQL
Bước 4: Di trú dữ liệu (pgloader hoặc script tự viết)
Bước 5: Chạy song song hai hệ, đối chiếu kết quả, rồi mới cắt chuyển
```

Làm theo thứ tự này thì mỗi bước đều **có thể quay lại được**. Chuyển thẳng từ
T-SQL viết tay sang PostgreSQL viết tay là một cú nhảy một chiều, hỏng thì
không có đường lùi.

---

## 5.6. Tóm tắt để trả lời khi bảo vệ

> PostgreSQL rẻ hơn và có `JSONB`, `pgvector` phù hợp với hướng AI của hệ thống.
> Nhóm đã đánh giá và ghi lại đầy đủ trong Phần 5. Lý do chưa chuyển không phải
> vì SQL Server tốt hơn, mà vì dự án truy vấn T-SQL viết tay không qua ORM —
> chuyển hệ quản trị đồng nghĩa viết lại khoảng 200 câu truy vấn, mất 3–5 ngày,
> rủi ro cao mà không thêm được chức năng nào. Nhóm chọn ưu tiên hoàn thiện
> chức năng theo đề cương trước, và đã ghi rõ các mốc điều kiện sẽ chuyển
> (vận hành thật, dùng pgvector, hoặc sau khi đã chuyển sang ORM).

Câu trả lời này thể hiện: **có đánh giá, có so sánh định lượng, có tiêu chí
quyết định** — mạnh hơn nhiều so với việc chuyển đổi cho có.
