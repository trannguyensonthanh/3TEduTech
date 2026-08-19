# Giới hạn 120MB cho ZIP — vì sao nâng số không phải câu trả lời

Bạn đúng: **không có khóa học thật nào vừa trong 120MB.** Nhưng nếu chỉ sửa
`IMPORT_MAX_ZIP_MB=2000` thì tệp 1.62GB của bạn vẫn hỏng, chỉ là hỏng ở chỗ
khác và muộn hơn — sau khi đã đợi 15 phút.

Tài liệu này liệt kê năm bức tường theo đúng thứ tự bạn sẽ đâm vào, rồi đề xuất
hướng đi.

---

## Phần 1 — Năm bức tường

### Tường 1 — Cloudinary gói miễn phí: **tối đa 100MB cho mỗi tệp video**

Đây là giới hạn của bên thứ ba, không sửa được bằng cấu hình.

Một bài giảng 1080p dài 30 phút thường nặng 300–600MB. Tệp ZIP 1.62GB của bạn
gần như chắc chắn chứa vài video vượt 100MB. Khi đó:

- ZIP tải lên thành công
- Giải nén thành công
- Bản nháp hiện ra, bạn duyệt, bấm đồng ý
- Rồi **hàng đợi tải video mới thất bại**, từng bài một, với lỗi từ Cloudinary

Đây là kiểu hỏng tệ nhất: hỏng ở bước cuối, sau khi người dùng đã bỏ ra 15 phút
và tin rằng mọi thứ ổn.

### Tường 2 — Cloudinary gói miễn phí: **25 credit/tháng**

1 credit = 1GB lưu trữ **hoặc** 1GB băng thông.

| Khoản | Với khóa 1.62GB |
|-------|-----------------|
| Lưu trữ | ~1,6 credit/tháng |
| Mỗi học viên xem hết khóa | ~1,6 credit |
| **Số lượt xem hết khóa trước khi cạn quota** | **~15 lượt** |

Và 25 credit đó dùng chung cho **toàn hệ thống** — ảnh đại diện, ảnh bìa khóa
học, tài liệu FAQ. Cạn quota nghĩa là ảnh trên trang cũng ngừng hiển thị.

Với một buổi bảo vệ đồ án thì 15 lượt xem là đủ. Với một hệ thống có người dùng
thật thì không.

### Tường 3 — Thời gian tải lên trong MỘT request HTTP

Mạng gia đình ở Việt Nam thường có tốc độ **tải lên** 5–20 Mbps (thấp hơn tải
xuống nhiều lần).

| Tốc độ tải lên | Thời gian cho 1.62GB |
|----------------|----------------------|
| 20 Mbps | ~11 phút |
| 10 Mbps | ~22 phút |
| 5 Mbps | ~44 phút |

Toàn bộ thời gian đó nằm trong **một request duy nhất**. Wifi chập một giây, máy
ngủ, đổi mạng — mất trắng, tải lại từ 0%. Không có cơ chế tiếp tục dở dang.

Ở production còn thêm hai chốt chặn: `client_max_body_size` của Nginx (đang đặt
250MB) và các mốc timeout của proxy.

### Tường 4 — Dung lượng đĩa

Một lần nhập khóa 1.62GB cần đồng thời:

```
1.62GB  tệp ZIP đã tải lên
1.62GB  nội dung sau khi giải nén
──────
~3.3GB  tạm thời, cho MỘT lần nhập
```

Máy dev của bạn đang gần hết dung lượng (đó là lý do `IMPORT_MAX_ZIP_MB` ở dev
được đặt 120 chứ không phải 200). EC2 t3.medium chỉ có ổ EBS 20–30GB, đã chứa
ảnh Docker ~2.5GB, hệ điều hành ~4GB, swap 2GB. Hai giảng viên nhập cùng lúc là
chạm trần — và ổ đầy trên EC2 thì Docker không ghi được log, Redis không lưu
được RDB, hỏng lan ra toàn hệ thống.

### Tường 5 — Server phải chạm vào từng byte

Hiện tại video đi đường: **trình duyệt → backend → đĩa → Cloudinary**. Backend
phải nhận, ghi, đọc lại và đẩy đi toàn bộ 1.62GB. Băng thông và đĩa của EC2
gánh trọn, dù server chẳng làm gì với nội dung video ngoài việc chuyển tiếp.

---

## Phần 2 — Điều đáng mừng: hạ tầng đúng ĐÃ CÓ SẴN

Khi rà mã nguồn, tôi tìm thấy hai thứ đã hoạt động và giải quyết được gần hết
các tường trên:

**1. Tải trực tiếp lên Cloudinary từ trình duyệt.**
`src/services/lesson.service.ts` đã có `uploadLessonVideoDirect()`: xin chữ ký
từ backend (`POST /lessons/:id/video-upload-token`), rồi trình duyệt gửi thẳng
tệp lên `api.cloudinary.com`, có thanh tiến độ, xong thì báo backend
(`PUT /lessons/:id/confirm-video`). **Server không chạm một byte nào của video.**

Đường này bỏ qua hoàn toàn Tường 3, 4 và 5.

**2. Hệ thống đã hỗ trợ video ngoài.**
Cột `VideoSourceType` nhận `YOUTUBE`, `VIMEO`, `CLOUDINARY`. Dữ liệu mẫu trong
V1 đã có sẵn bài học dùng YouTube (`ExternalVideoID = 'zBPeGR48_vE'`). Nghĩa là
đăng video lên YouTube ở chế độ *không công khai* rồi gắn ID vào bài học là một
đường đi **đã chạy được**, không phải viết mới.

Đường này bỏ qua **cả năm** bức tường — kể cả Tường 1 và 2.

Tính năng nhập khóa học chỉ đang không dùng tới hai thứ này.

---

## Phần 3 — Ba hướng đi

### Hướng A — Tách video ra khỏi ZIP *(khuyến nghị)*

**ZIP chỉ chứa cấu trúc + tài liệu + phụ đề. Video tải riêng, trực tiếp lên
Cloudinary từ trình duyệt.**

Đây là cách Udemy, Teachable, Coursera đều làm: tệp lớn không bao giờ đi qua
máy chủ ứng dụng.

Luồng mới:

```
1. Giảng viên nén cây thư mục — CHỈ tài liệu, phụ đề, và các tệp video RỖNG
   (hoặc cứ để nguyên video, hệ thống bỏ qua phần nội dung, chỉ đọc TÊN tệp)
   → ZIP còn vài MB đến vài chục MB
2. Tải lên (vài giây), hệ thống dựng chương–bài như hiện tại
3. Duyệt bản nháp, bấm đồng ý → khóa học được tạo, các bài video ở trạng thái
   "chờ video"
4. Màn hình bước 4 liệt kê các bài còn thiếu video.
   Giảng viên chọn MỘT LẦT tất cả video → hệ thống tự khớp theo TÊN TỆP với
   bài học tương ứng → tải song song trực tiếp lên Cloudinary, mỗi bài một
   thanh tiến độ
```

Điểm mấu chốt: bản nháp **đã ghi lại tên tệp video của từng bài** (`sourcePath`),
nên việc khớp tên là tự động — giảng viên không phải chỉ định thủ công bài nào
ứng với video nào.

| | |
|---|---|
| Giải quyết được | Tường 3, 4, 5 |
| Còn lại | Tường 1 (100MB/video) và Tường 2 (25 credit) |
| Công sức | ~1 buổi: sửa `fileClassifier` bỏ qua nội dung video, thêm màn hình tải video ở bước 4, dùng lại `uploadLessonVideoDirect` |
| Rủi ro | Thấp — hạ tầng tải trực tiếp đã chạy ở luồng bài học thường |

### Hướng B — Hướng A, cộng thêm YouTube cho video lớn

Giống Hướng A, nhưng ở bước 4 giảng viên có **hai lựa chọn cho mỗi bài**:

- **Tải lên Cloudinary** — cho video ≤100MB (màn hình quay, slide, bài ngắn)
- **Dán link YouTube** — cho video dài/nặng

Hệ thống lấy `videoId` từ link, đặt `VideoSourceType='YOUTUBE'`. Không tốn credit,
không giới hạn dung lượng, YouTube lo cả việc chuyển mã và phát ở nhiều độ phân
giải.

| | |
|---|---|
| Giải quyết được | **Cả năm tường** |
| Đánh đổi | Video nằm trên YouTube, không kiểm soát được hoàn toàn (chế độ *unlisted* thì ai có link đều xem được) |
| Công sức | Hướng A + ~2 giờ cho ô nhập link và phần lấy videoId |

### Hướng C — Chuyển kho video sang S3 + CloudFront

Đúng chuẩn production cho một nền tảng video, và bạn đã có sẵn tài khoản AWS.
Không giới hạn dung lượng tệp, giá rẻ hơn Cloudinary nhiều cho video, tải trực
tiếp từ trình duyệt bằng presigned URL (hỗ trợ multipart, tiếp tục được khi đứt).

| | |
|---|---|
| Giải quyết được | Cả năm tường |
| Công sức | 2–3 ngày: S3 bucket, IAM, CORS, presigned multipart, CloudFront + signed cookie để chặn xem lậu, sửa trình phát |
| Chi phí | ~0,023 USD/GB/tháng lưu trữ + ~0,114 USD/GB băng thông (Tokyo) — rẻ hơn Cloudinary rõ rệt, nhưng **không miễn phí** |

---

## Phần 4 — Khuyến nghị

**Làm Hướng B.** Cụ thể:

| Việc | Khi nào |
|------|---------|
| 1. Sửa ngay giới hạn + thông báo cho đúng (xem Phần 5) | 15 phút, làm luôn |
| 2. Tách video khỏi ZIP, thêm màn hình tải video trực tiếp | 1 buổi |
| 3. Thêm lựa chọn dán link YouTube | 2 giờ |
| 4. S3 + CloudFront | chỉ khi thật sự cần, sau khi bảo vệ đồ án |

Lý do chọn B chứ không phải C: xuyên suốt dự án bạn đã nói rõ ưu tiên là **chạy
được mượt mà trước**. Hướng B dùng lại hai thứ đã chạy sẵn trong mã nguồn, mất
khoảng một ngày, và gỡ được cả năm bức tường. Hướng C đúng chuẩn hơn nhưng là
2–3 ngày cho một thứ mà buổi bảo vệ không đòi hỏi.

Với **tệp 1.62GB cụ thể của bạn**: sau khi làm Hướng B, ZIP sẽ chỉ còn vài MB
(tài liệu + phụ đề), và các video nặng thì dán link YouTube — không đụng tới
Cloudinary chút nào.

---

## Phần 5 — Sửa ngay hôm nay, không cần đợi Hướng B

Ba thứ sai rành rành, độc lập với hướng đi bạn chọn:

**1. Giao diện không hề báo giới hạn trước.**
`CourseImport.tsx` không kiểm tra kích thước tệp. Bạn chọn tệp 1.62GB, hệ thống
im lặng bắt đầu tải, rồi mới báo lỗi từ máy chủ. Với mạng chậm, "im lặng" đó kéo
dài vài phút.
→ Kiểm tra ngay lúc chọn tệp, báo trước khi tải một byte nào.

**2. Giới hạn bị ghi cứng ở hai nơi, không đồng bộ.**
Backend biết `IMPORT_MAX_ZIP_MB` (dev 120, prod 200), giao diện thì không biết
gì. Đổi ở compose thì giao diện vẫn hiển thị số cũ.
→ Bổ sung `GET /v1/imports/limits` để giao diện đọc từ máy chủ.

**3. Thông báo lỗi chỉ nói "quá lớn", không nói phải làm gì.**
"Tệp quá lớn. Kích thước tối đa là 120MB." — đúng nhưng vô dụng. Người đọc
không biết vì sao lại là 120, và phải làm gì tiếp.
→ Nói rõ: *"Tệp ZIP chỉ nên chứa tài liệu và phụ đề. Video hãy để riêng, tải
lên ở bước 4 — vừa nhanh hơn nhiều vừa không giới hạn dung lượng."*

Riêng con số: **dev nâng 120 → 300MB, production giữ 200MB.** Sau khi tách
video, một ZIP tài liệu hiếm khi vượt 50MB, nên các con số này trở nên dư dả chứ
không còn là chỗ nghẽn.

---

## Phần 6 — Nếu vẫn muốn để video trong ZIP

Có một lý do chính đáng để giữ: giảng viên chỉ phải thao tác **một lần**, không
phải kéo thả từng video.

Nếu chọn hướng đó, cần đủ **cả bốn** thứ sau, thiếu một là hỏng:

1. Nâng `IMPORT_MAX_ZIP_MB` **và** `IMPORT_MAX_TOTAL_MB` **và**
   `IMPORT_MAX_FILE_MB` (ba biến khác nhau, chặn ở ba tầng khác nhau)
2. Nâng `client_max_body_size` của Nginx lên trên kích thước ZIP lớn nhất
3. Nới `IMPORT_MIN_FREE_DISK_GB` và mở rộng ổ EBS lên ≥100GB
4. **Vẫn phải giải quyết Tường 1** — video >100MB không lên Cloudinary miễn phí
   được, bất kể ZIP có qua hay không

Tức là dù đi đường nào, câu hỏi "video lớn đi đâu" vẫn phải trả lời. Đó chính là
lý do tôi khuyên giải quyết nó trước, thay vì nâng giới hạn ZIP rồi gặp lại nó
ở bước cuối.

---

**Nguồn:**
- [Cloudinary — So sánh các gói](https://cloudinary.com/pricing/compare-plans) (tối đa 100MB/video ở gói miễn phí)
- [Cloudinary Pricing 2026 — credit và gói miễn phí](https://theimagecdn.com/docs/cloudinary-pricing) (25 credit/tháng)
