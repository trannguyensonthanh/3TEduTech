# Tài liệu dự án 3T EduTech

[Sắp xếp lại 18/08/2026] Trước đây 12 tệp `.md` nằm rải ở thư mục gốc, lẫn với
mã nguồn và script. Nay chia làm hai mức: **đang dùng** và **lưu trữ**.

Nguyên tắc phân loại: một tài liệu ở lại thư mục này nếu bạn còn phải MỞ NÓ RA
ĐỌC để làm việc gì đó. Còn nếu nó chỉ ghi lại một quyết định đã thực hiện xong,
nó thuộc về `luu-tru/`.

---

## Đang dùng — mở khi cần làm việc

| Tệp | Dùng khi nào |
|-----|--------------|
| [`HUONG_DAN_CHAY_LOCAL.md`](HUONG_DAN_CHAY_LOCAL.md) | Cài đặt và chạy toàn hệ thống trên máy cá nhân. Mục 7 là phần xử lý sự cố — `start.ps1` trỏ thẳng vào đó khi có mục kiểm tra không đạt. |
| [`HUONG_DAN_TRIEN_KHAI_AWS.md`](HUONG_DAN_TRIEN_KHAI_AWS.md) | Đưa hệ thống lên AWS: nối mạng EC2↔RDS, cài máy chủ, biến môi trường, migration lên RDS, CI/CD tự động, tên miền miễn phí + HTTPS, và kế hoạch chuyển sang ba máy khi có quota GPU. Phụ lục cuối là danh sách 20 bước theo thứ tự. |
| [`PHAN_TICH_FLYWAY_VA_CSDL.md`](PHAN_TICH_FLYWAY_VA_CSDL.md) | Flyway có cần không, vì sao migration hay đổ, và cách chuẩn để đưa cơ sở dữ liệu lên RDS (backup/restore + baseline). Phần cuối là 7 quy tắc viết migration rút ra từ chính các lỗi đã gặp. |
| [`PHAN_TICH_FAQ_VA_TRIEN_KHAI.md`](PHAN_TICH_FAQ_VA_TRIEN_KHAI.md) | Vì sao FAQ không còn bảng CSDL, đường ống tài liệu chính sách PDF → RAG hoạt động ra sao, và cấu hình Docker/Compose cho hai giai đoạn triển khai. |

---

## `luu-tru/` — đã hoàn thành, giữ lại để tra cứu

Những tài liệu này mô tả các giai đoạn ĐÃ triển khai xong. Giữ lại vì chúng ghi
lại **vì sao** một số quyết định được đưa ra — thứ mà mã nguồn không kể được.
Không cần đọc để làm việc hằng ngày.

| Tệp | Nội dung | Trạng thái |
|-----|----------|-----------|
| `DE_XUAT_COURSE_IMPORT_AGENT.md` | Đề xuất đầu tiên cho tính năng nhập khóa học từ ZIP | ✅ đã triển khai |
| `KE_HOACH_COURSE_IMPORT_V2.md` | Bản kế hoạch thứ hai | ⚠️ **đã bị V4 thay thế** |
| `KE_HOACH_COURSE_IMPORT_V3.md` | Bản kế hoạch thứ ba | ⚠️ **đã bị V4 thay thế** |
| `KE_HOACH_COURSE_IMPORT_V4.md` | Bản kế hoạch cuối, là bản thực sự được triển khai (Giai đoạn A→D) | ✅ đã triển khai |
| `KE_HOACH_V2_CHINH_THUC.md` | Kế hoạch tổng thể phiên bản 2 | ✅ đã triển khai |
| `KE_HOACH_HOAN_THIEN_HE_THONG.md` | Danh sách hạng mục hoàn thiện toàn hệ thống | ✅ phần lớn đã xong |
| `LEVEL_1_COURSE_VERSIONING.md` | Phiên bản hóa khóa học | ✅ đã triển khai |
| `LEVEL_2_HOAN_THIEN.md` | Socket.IO, SSE, thông báo tức thời | ✅ đã triển khai |
| `LEVEL_3_CHAT_BAO_MAT.md` | Khóa nội bộ giữa backend và AI Service, bịt lỗ hổng `/ai-api/` | ✅ đã triển khai |
| `PHAN_5_POSTGRESQL.md` | Khảo sát chuyển sang PostgreSQL | ❌ **KHÔNG áp dụng** — dự án dùng SQL Server (RDS SQL Server trên AWS). Giữ lại chỉ để tra cứu nếu sau này tính chuyện chuyển đổi. |

> **Ba tệp `KE_HOACH_COURSE_IMPORT_V2/V3` và `PHAN_5_POSTGRESQL` là ứng viên xóa
> hẳn.** Tôi không tự xóa vì V2/V3 có thể còn chứa lý lẽ mà V4 lược đi, và xóa
> thì không lấy lại được (chúng chưa được Git theo dõi). Nếu bạn chắc chắn không
> cần, cứ xóa tay ba tệp đó — sẽ gọn đi khoảng 60KB.

---

## Ghi chú

Các tệp `.md` này **chưa được Git theo dõi** (kiểm tra bằng `git ls-files '*.md'`
— chỉ thấy README của từng module). Nghĩa là chúng chỉ tồn tại trên máy bạn:
xóa nhầm thì không có lịch sử nào để khôi phục, và người khác clone kho về cũng
sẽ không thấy chúng.

Nếu muốn chúng đi cùng dự án, hãy thêm vào Git:

```bash
git add docs/
git commit -m "docs: gom tài liệu vào thư mục docs/"
```

`README.md` của từng module (`3t-edu-tech-backend/`, `ai-service/`,
`edu-ai-learning-hub/`) vẫn nằm nguyên chỗ cũ — đó là chỗ người ta tìm chúng.
