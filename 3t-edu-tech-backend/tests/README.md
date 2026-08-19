# Bộ kiểm thử tự động — 3T EduTech

## Chạy như thế nào

Bộ test gọi vào một máy chủ ĐANG SỐNG, không tự dựng server. Bật hệ thống trước:

```powershell
.\start.bat
```

Rồi:

```powershell
cd 3t-edu-tech-backend
npm test
```

### Chạy từng nhóm

| Lệnh | Phủ |
|---|---|
| `npm run test:smoke` | Máy chủ có sống không |
| `npm run test:core` | Xác thực + dựng 4 tài khoản test |
| `npm run test:courses` | Vòng đời khóa học, phân quyền, phiên bản |
| `npm run test:import` | Nhập khóa học từ ZIP, tách video |
| `npm run test:ai` | AI Service, RAG, chatbot, FAQ |
| `npm run test:reports` | Báo cáo & thống kê |
| `npm test` | Tất cả |

### Biến môi trường

```powershell
# Tài khoản admin dùng để kích hoạt các tài khoản test
$env:TEST_ADMIN_EMAIL="3tedutech@gmail.com"
$env:TEST_ADMIN_PASSWORD="..."

# Bật các test CÓ GỌI MÔ HÌNH THẬT (tốn hạn mức Gemini) — chạy 1 lần trước demo
$env:TEST_AI_LIVE="1"

# Nếu backend/AI không chạy ở cổng mặc định
$env:API_BASE_URL="http://localhost:5000/v1"
$env:AI_BASE_URL="http://localhost:2111"
```

---

## Bộ test này khác bản trước ở đâu

### 1. Trước đây gần như MỌI test đều tự bỏ qua rồi báo PASS

`helpers/api.js` giữ `state` (token, id…) trong một biến module, với ý định
`01-auth` đăng nhập rồi `02`…`12` dùng lại.

Jest không làm việc như vậy. **Mỗi tệp test chạy trong một module registry
riêng** — kể cả với `maxWorkers: 1` và `--runInBand`, tức chung một tiến trình.
Hai tệp cùng `require('./helpers/api')` nhận về hai object khác nhau.

Nên `state.studentToken` ở tệp `05` luôn là `null`. Mà các tệp đó mở đầu bằng:

```js
if (!token) { console.log('  ⏭️ Skip'); return; }
```

Kết quả: bỏ qua sạch, Jest báo xanh, không kiểm tra một dòng nghiệp vụ nào.

**Đã sửa:** `helpers/state.js` đẩy state xuống `tests/.state.json` qua một
`Proxy` — mỗi phép gán ghi luôn ra tệp. Các tệp test cũ không phải sửa dòng nào.

### 2. Trước đây mọi vai trò đều là cùng MỘT tài khoản SA

Bộ cũ dùng token admin cho cả học viên lẫn giảng viên, kèm chú thích *"SA có
quyền tương đương"*. Điều đó vô hiệu hóa đúng thứ đáng kiểm nhất — **phân
quyền**. Lỗi kiểu "học viên gọi được API xóa khóa học" không bao giờ lộ ra.

**Đã sửa:** `01b-accounts.test.js` dựng **bốn danh tính riêng**: admin, giảng
viên (GV), học viên (HV), và học viên thứ hai để thử truy cập chéo. Rào cản
"đăng ký xong phải verify email mới đăng nhập được" được vượt qua bằng đúng
cửa hợp lệ: admin gọi `PATCH /users/:id/status`.

### 3. Trước đây thất bại chỉ được `console.log`

```js
if (res.status === 200) { ... } else {
  console.log(`⚠️ Tạo đơn: Status ${res.status}`);   // rồi thôi
}
```

Đơn hàng lỗi 500 vẫn ra màu xanh.

**Đã sửa:** thêm `expectStatus(res, 200, 'mô tả')` — sai thì ném lỗi kèm
NGUYÊN VĂN phần thân phản hồi, để lúc đỏ còn biết vì sao.

> ⚠️ Đừng viết `expect(res.status, why(res)).toBe(200)`. Khác với Chai, `expect`
> của Jest **không** nhận tham số thông báo thứ hai — nó bị bỏ qua lặng lẽ.

### 4. Test đổi mật khẩu từng đổi mật khẩu ADMIN THẬT

Đổi rồi đổi ngược. Nếu lượt đổi ngược hỏng giữa chừng, tài khoản admin nằm lại
với mật khẩu `NewPass@123456` mà không ai biết. Nay phép thử đó chạy trên tài
khoản học viên do chính bộ test tạo ra.

---

## Các tệp

| Tệp | Nội dung |
|---|---|
| `00-smoke` | Máy chủ sống, endpoint công khai |
| `01-auth` | Đăng ký, đăng nhập, chặn truy cập thiếu token |
| **`01b-accounts`** | Dựng 4 danh tính riêng — **mọi tệp sau phụ thuộc tệp này** |
| `02`–`12` | Bộ cũ (duyệt, giỏ hàng, tiến độ, tài chính, chứng nhận…) |
| **`14-course-lifecycle`** | Tạo → duyệt → xuất bản → phiên bản, kèm thử ngược quyền |
| **`15-zip-import`** | Giới hạn, từ chối đầu vào sai, ZIP thật, **tách video** |
| **`16-ai-rag-faq`** | Sức khỏe AI, khóa nội bộ, phiên chat, FAQ, (tùy chọn) LLM thật |
| **`17-reports`** | Báo cáo giảng viên & quản trị, quản lý người dùng |

### Thứ tự chạy

`helpers/testSequencer.js` sắp theo tên tệp. `01b` nằm giữa `01` và `02` — cố ý.

---

## Khi test đỏ

1. **Đọc dòng đầu của thông báo lỗi.** `expectStatus` in cả phần thân phản hồi.
2. **`status=0`** nghĩa là không gọi tới được máy chủ (chưa bật, hoặc sai cổng).
3. **429 ở nhóm ZIP** là hết hạn mức 5 lần/giờ — chờ sang giờ sau, không phải lỗi code.
4. **Nhóm `16-ai-*` đỏ hàng loạt** — xem dòng cảnh báo AI Service ở đầu lượt chạy.
5. **Muốn chạy lại từ đầu sạch sẽ:** xóa `tests/.state.json` (globalSetup tự làm mỗi lượt).
