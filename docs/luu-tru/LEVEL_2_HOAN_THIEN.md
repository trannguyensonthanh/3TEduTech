# Level 2 — Bàn giao & Kiểm thử

> Ngày: 17/08/2026 · Trạng thái: **đã commit vào dự án**
> Tiền đề: đã chạy V4, V5, V6.

---

## 0. HAI VIỆC PHẢI LÀM TRƯỚC KHI CHẠY

### 0.1. Cài 2 gói mới (không bắt buộc, nhưng nên)

```bash
cd 3t-edu-tech-backend  && npm install socket.io
cd ../edu-ai-learning-hub && npm install socket.io-client
```

**Không cài cũng không sao.** Cả hai chỗ nạp thư viện đều nằm trong `try/catch`
và nạp trễ (lazy). Chưa cài thì hệ thống chạy y như cũ, chỉ ghi một dòng thông
báo; thông báo tức thời vẫn hoạt động qua SSE. Thiết kế như vậy để một tính
năng phụ không thể làm sập cả hệ thống lúc khởi động.

### 0.2. Thêm 1 biến môi trường

Vào `.env` (và `.env.production`):

```env
CERTIFICATE_SECRET=<chuỗi ngẫu nhiên >= 32 ký tự>
```

Sinh nhanh:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Thiếu biến này hệ thống **vẫn chạy**: nó tự dùng tạm `JWT_SECRET` và ghi cảnh
báo. Nhưng nên đặt riêng — nếu sau này phải xoay vòng `JWT_SECRET` vì lộ, mọi
chứng chỉ đã cấp sẽ đồng loạt bị coi là "không toàn vẹn".

⚠️ Đặt xong thì **không đổi nữa**. Chữ ký được tính từ khóa này; đổi khóa =
mọi chứng chỉ cũ hỏng chữ ký.

---

## 1. ★ BỐN LỖI NGHIÊM TRỌNG PHÁT HIỆN TRONG QUÁ TRÌNH RÀ SOÁT

Đây là phần đáng chú ý nhất của Level 2. Cả bốn đều là **tính năng đã viết
xong nhưng chưa bao giờ chạy được** — loại lỗi nguy hiểm nhất vì nhìn code thì
tưởng đã có.

### 1.1. SSE chưa bao giờ gửi được một thông báo nào

`events.controller.js` lưu client vào Map với khóa là **SỐ**:
```js
addClient(req.user.id, res)   // req.user.id = AccountID (BIGINT) → 12
```
`notifications.service.js` lại tra cứu bằng **CHUỖI**:
```js
sendEventToUsers(recipientId.toString(), ...)   // → clients.has('12')
```

`Map` của JavaScript so khớp bằng SameValueZero — `12` và `'12'` là **hai khóa
khác nhau**. `clients.has('12')` luôn `false`.

Đau nhất: bản vá ở Level 0 (bỏ điều kiện `if (type === 'COURSE_SUBMITTED')` để
đẩy mọi loại thông báo) là **đúng** nhưng hoàn toàn vô tác dụng, vì nút thắt
thật nằm ở đây. Và log chỉ ghi mức `warn` ("No active SSE connections") nên
nhìn vào cứ tưởng người dùng offline.

→ **Đã sửa:** chuẩn hóa khóa qua đúng một hàm `key()`. Mọi lối vào/ra Map đều
đi qua nó nên kiểu không bao giờ lệch được nữa.

### 1.2. Nginx chặn SSE ở production (nhưng dev thì chạy tốt)

Block `location /v1/` trong `nginx.conf` **không tắt `proxy_buffering`**. Nginx
mặc định gom toàn bộ phản hồi rồi mới gửi cho client — nhưng SSE là luồng không
bao giờ kết thúc, nên Nginx cứ gom mãi.

Bẫy ở chỗ: môi trường dev (Vite gọi thẳng backend, không qua Nginx) chạy hoàn
hảo. Lỗi chỉ lộ ra sau khi lên production.

→ **Đã sửa:** tách riêng `location /v1/events/` với `proxy_buffering off`,
`proxy_cache off`, `gzip off`, `proxy_http_version 1.1`, `Connection ""`.

### 1.3. Job nhắc nhở học viên chưa bao giờ chạy

`progressReminderJob.js` truy vấn:
```sql
SELECT ... a.FullName, a.Email FROM Accounts a
```
Nhưng bảng `Accounts` **không có cột `FullName`** — cột đó nằm ở `UserProfiles`.
SQL Server trả `Invalid column name 'FullName'`, lỗi bị `try/catch` ngoài cùng
nuốt, để lại đúng một dòng error lúc 9 giờ sáng mỗi ngày.

Nghĩa là tính năng "nhắc nhở học viên" mà đề cương yêu cầu **chưa từng gửi đi
một lời nhắc nào**.

→ **Đã sửa:** `LEFT JOIN UserProfiles up ON e.AccountID = up.AccountID`.

### 1.4. Mã chứng chỉ tự chế trên trình duyệt

Frontend cũ ghép mã ngay tại client: `CERT-${courseId}-${accountId}`.
Không lưu ở đâu, không tra cứu được, và ai biết công thức cũng tự tạo được một
mã "hợp lệ" — tấm chứng chỉ hoàn toàn vô giá trị.

→ **Đã sửa:** toàn bộ module chứng chỉ ở mục 2 bên dưới.

---

## 2. Module Chứng chỉ (mục 2.1 + 2.2)

### 2.1. Ba lớp chống giả mạo

| Lớp | Cơ chế | Chặn được gì |
|---|---|---|
| 1 | `CertificateCode` ngẫu nhiên bằng `crypto.randomBytes(5)` (2^40 khả năng), lưu trong DB | Không tự chế, không đoán được |
| 2 | `VerificationHash` = HMAC-SHA256 trên `code\|accountId\|courseId\|issuedAt\|studentName\|courseName` | Sửa thẳng DB cũng không tạo nổi chữ ký hợp lệ. Tên học viên nằm trong chữ ký nên không "chuyển" chứng chỉ sang tên người khác được |
| 3 | Endpoint xác minh **công khai** + mã QR trên chứng chỉ | Ai cũng kiểm chứng được, không cần tài khoản |

So sánh chữ ký dùng `crypto.timingSafeEqual`, không dùng `===`. So sánh chuỗi
thường thoát ra ngay tại byte đầu khác nhau, nên thời gian chạy tiết lộ "đoán
đúng bao nhiêu ký tự" — dò từng byte là ra chữ ký (timing attack).

### 2.2. Dữ liệu bất biến (các cột `*Snapshot`)

Chứng chỉ lưu **ảnh chụp** tên học viên, tên khóa học, tên giảng viên, số bài
học và số phiên bản giáo trình tại đúng thời điểm cấp. Giảng viên đổi tên khóa
học sau đó, tấm chứng chỉ đã cấp **không đổi theo** — giấy tờ đã cấp mà tự thay
nội dung thì không còn là giấy tờ.

Ăn khớp với Course Versioning ở Level 1: `CourseID` trỏ đúng **phiên bản học
viên đã học**, nên chứng chỉ ghi chính xác họ học giáo trình v1 hay v2.

### 2.3. Cấp tự động, idempotent

Có **ba** đường dẫn cùng phát hiện "đã hoàn thành":

1. `markLessonCompletion` — bấm xong bài cuối
2. `getCourseProgress` — mở lại trang khóa học (chống race)
3. Học viên tự bấm `POST /certificates/issue/:courseId`

Hai đường đầu có thể chạy **song song trong cùng một giây**. Ràng buộc
`UNIQUE(AccountID, CourseID)` chặn trùng ở tầng CSDL, và service bắt lỗi trùng
khóa rồi **đọc lại bản ghi của tiến trình kia** thay vì trả 500 cho học viên
vừa tốt nghiệp.

Việc cấp chạy **nền, không `await`**: gửi email qua SMTP có thể mất vài giây,
không có lý do gì để học viên vừa bấm "hoàn thành bài học" phải ngồi chờ.

### 2.4. API

| Method | Đường dẫn | Quyền |
|---|---|---|
| `GET` | `/v1/certificates/verify/:code` | **CÔNG KHAI** — đích của mã QR |
| `GET` | `/v1/certificates/me` | Học viên |
| `GET` | `/v1/certificates/eligibility/:courseId` | Học viên |
| `POST` | `/v1/certificates/issue/:courseId` | Học viên |
| `GET` | `/v1/certificates/:code` | Chủ sở hữu hoặc Admin |
| `PATCH` | `/v1/certificates/:code/revoke` | Admin |

Hai chi tiết cố ý:
- **`/verify/:code` luôn trả HTTP 200**, kể cả khi chứng chỉ giả. "Mã này không
  hợp lệ" là câu trả lời *thành công* của việc tra cứu, không phải lỗi máy chủ.
  Nhờ vậy giao diện phân biệt được "mất mạng" với "chứng chỉ giả".
- **Route `/me` khai báo TRƯỚC `/:code`.** Ngược lại thì `/me` bị `/:code` nuốt.

---

## 3. Giao diện chứng chỉ (mục 2.2)

Thiết kế mới: nền tối, lưới mạch điện, ngoặc góc kiểu HUD, dấu niêm phong lục
giác ánh kim, mã QR, mã chứng chỉ dạng monospace.

**Không cần cài thêm gói nào** — dự án đã sẵn `@react-pdf/renderer`,
`qrcode.react`, `html2canvas`.

### Ba bẫy kỹ thuật đã né

| Bẫy | Hậu quả nếu dính | Cách xử lý |
|---|---|---|
| `html2canvas` không dựng được `bg-clip-text`, `backdrop-blur`, `filter: blur()` | Màn hình đẹp, **file PNG tải về mất chữ** | Hiệu ứng phát sáng làm bằng `radial-gradient`, `box-shadow`, `text-shadow` và SVG nội tuyến |
| `backgroundColor: null` trong html2canvas | Nền trong suốt → chữ trắng biến mất khi mở PNG trên nền trắng | Chỉ định tường minh `#070d1b` |
| Font mặc định của `@react-pdf/renderer` (Helvetica) **không có tiếng Việt** | "Nguyễn Văn Đức" → "Nguyn Vn c" — ký tự có dấu bị **nuốt mất**, dễ tưởng lỗi dữ liệu | Đăng ký **Roboto** (đã có sẵn `public/fonts/Roboto-*.ttf`, đủ bộ ký tự tiếng Việt) |

Mã QR trong PDF: `qrcode.react` là component DOM nên không đặt được vào cây
`<Document>` của react-pdf. `HiddenQrCanvas.tsx` vẽ QR ra canvas ngoài khung
nhìn rồi trả `toDataURL()` để nhúng làm `<Image>`.
(Dùng thủ thuật đẩy ra ngoài màn hình chứ **không** dùng `display:none` — phần
tử `display:none` không được bố trí nên canvas có thể còn trống khi đọc.)

### Trang xác minh công khai

`/verify-certificate/:code` — nằm ngoài mọi `ProtectedRoute`. Bốn trạng thái:
`VALID` · `REVOKED` · `TAMPERED` · `NOT_FOUND`, cộng một trạng thái **riêng cho
lỗi mạng** (không gộp vào "không hợp lệ" — người mất mạng không đáng bị báo là
cầm chứng chỉ giả).

Với `TAMPERED`, trang **cố ý không dựng lại hình chứng chỉ** — làm vậy chỉ giúp
kẻ giả mạo có ảnh đẹp đi khoe.

---

## 4. Realtime (mục 2.3)

**Giữ cả SSE lẫn Socket.IO, không thay thế.**

- **SSE** (đã có, nay đã vá lỗi ở §1.1 + §1.2): thông báo cá nhân server→client.
  Nhẹ, chạy trên HTTP thường, tự kết nối lại.
- **Socket.IO** (mới): phần SSE *không* làm được — hai chiều và khái niệm
  "phòng". Dùng cho thảo luận theo khóa học.

Viết lại phần thông báo sang Socket.IO là công không cần thiết và có rủi ro,
trong khi SSE sau khi vá đã chạy đúng.

**Bảo mật:** xác thực JWT ngay ở bước bắt tay, **trước** khi cho vào phòng.
Nếu để client tự khai `accountId` rồi mới join thì bất kỳ ai cũng `join('user:5')`
được và nghe trộm thông báo riêng của người khác.

**Chỉ truyền tín hiệu, không truyền nội dung.** Server phát "phòng này có thay
đổi", client tự gọi REST API để lấy dữ liệu — nhờ vậy quyền xem vẫn do REST API
kiểm soát, không phải nhân đôi logic phân quyền sang tầng socket.

**Nginx:** đã thêm `map $http_upgrade $connection_upgrade` và
`location /socket.io/`. Thiếu block `map`, WebSocket bị nâng cấp hụt và
Socket.IO tụt vĩnh viễn xuống long-polling — vẫn "chạy" nên rất khó phát hiện,
chỉ là tốn tài nguyên gấp nhiều lần.

---

## 5. Email nhắc nhở (mục 2.4)

Ngoài việc sửa lỗi `FullName` ở §1.3:

- **Gửi email song song với thông báo in-app.** Thông báo in-app chỉ tới được
  người *đang mở* website — mà học viên bỏ học 3 ngày thì gần như chắc chắn
  không mở.
- **Chống làm phiền:** bản cũ nhắc lại **mỗi ngày**. Nghỉ hai tuần = 14 email,
  đủ để bấm "báo cáo spam" và làm ảnh hưởng uy tín tên miền gửi thư. Nay mỗi
  (học viên × khóa học) chỉ nhắc lại sau **7 ngày**.
- **Chống treo:** lời gọi tới AI Service trước đây không có timeout. AI Service
  nằm trên EC2 khác; nó treo thì job treo theo vô hạn, giữ mãi một kết nối
  trong pool CSDL. Nay có timeout 20s **và** câu nhắc dự phòng — AI hỏng thì
  học viên vẫn nhận được lời nhắc.
- **Bao gồm cả học viên đang học phiên bản cũ** (`StatusID IN ('PUBLISHED',
  'SUPERSEDED')`). Lọc theo mỗi `PUBLISHED` sẽ bỏ sót đúng nhóm này.

Hai mẫu email mới: `certificateIssued.hbs`, `progressReminder.hbs` — viết theo
lối bảng lồng bảng + CSS inline vì Gmail/Outlook lược bỏ thẻ `<style>` và không
hỗ trợ flexbox.

---

## 6. PostgreSQL (mục 2.5)

Xem file riêng: **`PHAN_5_POSTGRESQL.md`** — có bảng so sánh định lượng, ước
lượng khối lượng chuyển đổi (~200 câu truy vấn, 3–5 ngày), và các mốc điều kiện
sẽ chuyển. Đưa thẳng vào báo cáo được.

---

## 7. KỊCH BẢN KIỂM THỬ

### TC-01 · SSE thực sự hoạt động (kiểm chứng bản vá §1.1)
1. Đăng nhập bằng tài khoản A, mở website, giữ nguyên tab.
2. Bằng tài khoản khác, làm gì đó sinh thông báo cho A (ví dụ: Admin duyệt khóa
   học của A).
3. ✅ Log backend hiện `Sending SSE event 'new_notification' to User <id> (1 connections)`
   — **mức info**, không phải `[EventManager] ... không có kết nối`.
4. ✅ Chuông thông báo của A nhảy số **ngay lập tức**, không cần F5.

### TC-02 · Cấp chứng chỉ tự động
1. Học viên hoàn thành bài học **cuối cùng** của một khóa.
2. ✅ Log: `🎓 [Certificates] Đã cấp 3TEDU-2026-XXXXXXXXXX cho account ...`
3. ```sql
   SELECT CertificateCode, StudentNameSnapshot, CourseNameSnapshot,
          CourseVersionNumber, TotalLessonsSnapshot, FinalQuizAverage, IssuedAt
   FROM Certificates WHERE AccountID = <id>;
   ```
   ✅ Có đúng 1 dòng, các cột `*Snapshot` đã điền.
4. ✅ Nhận thông báo in-app + email "🎓 Chứng chỉ hoàn thành khóa học...".

### TC-03 · Idempotent (không cấp trùng)
1. Mở lại trang khóa học vài lần, bấm cả `POST /certificates/issue/:courseId`.
2. ✅ `SELECT COUNT(*) FROM Certificates WHERE AccountID=<id> AND CourseID=<id>`
   luôn bằng **1**.
3. ✅ Không có lỗi 500 nào trong log.

### TC-04 · Xem & tải chứng chỉ
1. Vào `/certificates`.
2. ✅ Thẻ chứng chỉ hiện mã thật (`3TEDU-...`), huy hiệu "Hợp lệ".
3. Bấm **Xem** → ✅ chứng chỉ nền tối, lưới mạch, dấu niêm phong, QR.
4. Bấm **Tải ảnh PNG** → ✅ mở file ra: nền tối **không trong suốt**, chữ trắng
   đầy đủ, QR sắc nét.
5. Bấm **Tải bản PDF** → ✅ **tên tiếng Việt có dấu hiển thị đúng** (đây là bài
   kiểm tra font Roboto), QR có trong PDF.

### TC-05 · ⭐ Xác minh công khai — bài quan trọng nhất
1. Dùng điện thoại quét mã QR trên chứng chỉ.
2. ✅ Mở `/verify-certificate/3TEDU-...` — **hiển thị được mà KHÔNG cần đăng nhập**.
3. ✅ Khung xanh "Chứng chỉ hợp lệ" + tên học viên, khóa học, ngày cấp, phiên
   bản giáo trình.
4. Mở trình duyệt ẩn danh, vào `/verify-certificate`, gõ tay mã → ✅ kết quả y hệt.

### TC-06 · Chống giả mạo
1. Nhập mã bịa: `3TEDU-2026-0000000000` → ✅ "Không tìm thấy chứng chỉ".
2. Nhập rác: `ABC123` → ✅ "Mã không đúng định dạng" (Joi chặn từ backend).
3. **Kiểm tra chữ ký** — sửa thẳng trong CSDL:
   ```sql
   UPDATE Certificates SET StudentNameSnapshot = N'Kẻ Giả Mạo'
    WHERE CertificateCode = '3TEDU-2026-XXXXXXXXXX';
   ```
   Xác minh lại → ✅ **"Chứng chỉ không toàn vẹn"** (TAMPERED), và log backend
   ghi mức **error**: `⚠️ CHỮ KÝ KHÔNG HỢP LỆ`.
   ✅ Trang **không** dựng lại hình chứng chỉ.

   👉 Đây là bằng chứng trực quan nhất cho phần "bảo mật" trong báo cáo — nên
   chụp màn hình.

   Nhớ khôi phục lại tên đúng sau khi thử.

### TC-07 · Thu hồi (Admin)
```
PATCH /v1/certificates/3TEDU-2026-XXXXXXXXXX/revoke
Body: { "reason": "Phát hiện gian lận trong bài kiểm tra cuối khóa" }
```
1. ✅ Lý do dưới 10 ký tự bị Joi từ chối.
2. ✅ Xác minh lại → khung vàng "Đã bị thu hồi" + lý do + thời điểm.
3. ✅ Học viên nhận thông báo về việc thu hồi.
4. ✅ Thu hồi lần hai → 400 "đã bị thu hồi trước đó" (không ghi đè dấu vết cũ).

### TC-08 · Chứng chỉ ghi đúng phiên bản (nối với Level 1)
1. Học viên hoàn thành khóa ở **v1**, nhận chứng chỉ.
2. Giảng viên tạo v2, Admin duyệt → v1 chuyển `SUPERSEDED`.
3. ✅ Chứng chỉ vẫn ghi `CourseVersionNumber = 1` và **tên khóa học cũ**.
4. ✅ Trên chứng chỉ hiện nhãn "Giáo trình v1".

### TC-09 · Nhắc nhở qua email (kiểm chứng bản vá §1.3)
```js
// Chạy tay, không cần đợi tới 9h sáng:
require('./src/jobs/progressReminderJob').triggerAIProgressReminders();
```
1. ✅ Log: `Found N students to remind` với **N > 0** (trước đây luôn lỗi
   `Invalid column name 'FullName'`).
2. ✅ Học viên nhận email có thanh tiến độ.
3. Chạy lại lần nữa ngay → ✅ `Found 0 students` (thời gian chờ 7 ngày).

### TC-10 · Socket.IO (chỉ khi đã cài 2 gói)
1. Khởi động lại backend → ✅ log `[Socket.IO] Lớp realtime hai chiều đã sẵn sàng`.
2. Chưa cài gói → ✅ log cảnh báo `Chưa cài gói socket.io...` và **server vẫn
   khởi động bình thường** (đây cũng là một bài kiểm thử).
3. Mở cùng một khóa học trên hai trình duyệt, đăng nhập hai tài khoản.
4. Tài khoản A đăng bình luận → ✅ tab của B nhận `discussion:changed`.
5. Tắt server → ✅ tắt gọn trong vài giây, **không treo** (Socket.IO được đóng
   trước `server.close()`).

---

## 8. Danh sách file đã thay đổi

### Backend — mới
```
src/api/certificates/certificates.repository.js
src/api/certificates/certificates.service.js
src/api/certificates/certificates.controller.js
src/api/certificates/certificates.routes.js
src/api/certificates/certificates.validation.js
src/services/socket.service.js
src/views/emails/certificateIssued.hbs
src/views/emails/progressReminder.hbs
```

### Backend — sửa
| File | Nội dung |
|---|---|
| `src/services/event.manager.js` | **Vá lỗi lệch kiểu khóa Map** + dọn kết nối chết |
| `src/jobs/progressReminderJob.js` | **Vá lỗi `FullName`** + email + chống spam + timeout |
| `src/api/progress/progress.service.js` | Cấp chứng chỉ tự động ở cả 2 điểm khóa hoàn thành |
| `src/api/discussions/discussions.service.js` | Phát tín hiệu `discussion:changed` |
| `src/config/index.js` | Khai báo `CERTIFICATE_SECRET` |
| `src/app.js` | Gắn `/v1/certificates` |
| `server.js` | Khởi tạo + đóng gọn Socket.IO |

### Frontend
| File | Nội dung |
|---|---|
| `components/certificates/CertificateDisplay.tsx` | **Thiết kế lại** phong cách công nghệ |
| `components/certificates/CertificatePDFDocument.tsx` | **Thiết kế lại** + font Roboto (tiếng Việt) |
| `components/certificates/HiddenQrCanvas.tsx` | **Mới** — QR → data URL cho PDF |
| `services/certificate.service.ts` | **Mới** |
| `pages/Certificates.tsx` | **Viết lại** dùng API thật |
| `pages/VerifyCertificate.tsx` | **Mới** — trang xác minh công khai |
| `hooks/useCourseRealtime.ts` | **Mới** |
| `router.tsx` | 2 route công khai `/verify-certificate` |

### Hạ tầng
| File | Nội dung |
|---|---|
| `nginx/nginx.conf` | **Vá lỗi buffering chặn SSE** + hỗ trợ WebSocket |

---

## 9. Chưa làm — ghi rõ để không tưởng là đã có

- **Sinh PDF phía server.** Kế hoạch ban đầu ghi vậy, nhưng sẽ phải thêm
  `puppeteer` (~300MB, cần thư viện hệ thống trong Docker) hoặc `pdfkit` (dựng
  lại toàn bộ thiết kế lần thứ ba). Frontend đã có sẵn `@react-pdf/renderer`
  nên dựng PDF ngay trên trình duyệt — **không thêm gói nào, không tăng tải máy
  chủ**. Nếu sau này cần đính kèm PDF vào email thì mới phải làm phía server.
- **Nhúng `useCourseRealtime` vào trang thảo luận.** Hook đã sẵn sàng nhưng tôi
  chưa gắn vào `CourseLearningPage.tsx` — cần đọc kỹ cấu trúc trang đó trước,
  và tôi không muốn sửa mù vào màn hình học tập đang chạy tốt. Cách dùng:
  ```tsx
  useCourseRealtime(courseId, () => refetchDiscussions());
  ```
- **Giao diện thu hồi chứng chỉ cho Admin.** API đã có; màn hình quản trị chưa.
- **Cấp chứng chỉ hàng loạt** cho học viên đã tốt nghiệp từ trước: không cần
  script — họ sẽ được cấp tự động ngay lần đầu mở lại trang khóa học (lưới an
  toàn trong `getCourseProgress`).

---

## 10. Bước tiếp theo — Level 3

Lịch sử chat AI (chạy `V7__chat_history.sql`), xác thực cho AI Service, và giới
hạn tần suất gọi.

⚠️ Nhắc lại rủi ro bảo mật đã ghi từ trước, đến Level 3 mới xử lý:
`ai.service.ts:4-5` **hardcode `MASTER_API_KEY` / `COURSE_AI_API_KEY` ngay
trong mã frontend** — hai khóa này bị đóng gói vào file JS gửi xuống trình
duyệt, ai mở DevTools cũng đọc được. Cộng với việc AI Service **không kiểm tra
xác thực gì cả**, proxy công khai `/ai-api/` cho phép người ngoài gọi thẳng và
đốt hết hạn mức token.
