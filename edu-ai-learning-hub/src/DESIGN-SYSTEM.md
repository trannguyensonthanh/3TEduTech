# Quy ước giao diện 3T EduTech

Tài liệu này là hợp đồng. Mọi màn hình phải tuân theo, để hệ thống trông như một
sản phẩm chứ không phải nhiều sản phẩm ghép lại.

## 1. Không viết mã màu trực tiếp

Cấm dùng trong `.tsx`: mã hex, `bg-slate-900`, `text-violet-400`, `from-…`,
`via-…`, `to-…`, `bg-gradient-*`, `backdrop-blur`, `bg-white/5`, `border-white/10`.

Dùng token:

| Ý nghĩa | Lớp Tailwind |
|---|---|
| Nền trang | `bg-background` |
| Mặt thẻ | `bg-card` |
| Chữ chính | `text-foreground` |
| Chữ phụ, nhãn, trục | `text-muted-foreground` |
| Đường viền, đường kẻ | `border-border` |
| Hành động chính, liên kết, mục đang chọn | `bg-primary` / `text-primary` |
| Nền nhạt khi di chuột / đang chọn | `bg-accent` / `bg-muted` |
| Trạng thái | `text-success` `text-warning` `text-danger` (+ `bg-*-soft`) |

Màu trạng thái **luôn** đi kèm biểu tượng và nhãn chữ. Không bao giờ để riêng màu
gánh ý nghĩa.

## 2. Thứ bậc thị giác

- Thẻ: `rounded-xl border border-border bg-card`. **Không đổ bóng.** Bóng chỉ dành
  cho lớp nổi lên trên: hộp thoại, menu, tooltip.
- Không có nền tối cục bộ. Một trang không được tự đặt nền tối trong khi phần còn
  lại của ứng dụng đang sáng — chế độ tối do lớp `.dark` ở gốc quyết định.
- Không hiệu ứng phát sáng, không khối mờ trang trí, không chữ chuyển sắc.
- Cỡ chữ tiêu đề lấy từ `h1`/`h2`/`h3` đã đặt sẵn, hoặc dùng `PageHeader` và
  `SectionCard`. Không tự đặt `text-4xl font-black`.

## 3. Bố cục trang trong khu làm việc

```tsx
<AdminLayout pageTitle="…">          {/* hoặc InstructorLayout */}
  <PageHeader title="…" description="…" actions={…} />
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <StatCard label="…" value={…} icon={…} />
  </div>
  <SectionCard title="…">…</SectionCard>
</AdminLayout>
```

Khoảng cách dọc giữa các khối do khung lo (`page-stack`), trang không tự đặt.

Thành phần dùng chung:
- `@/components/common/PageHeader`
- `@/components/common/SectionCard`
- `@/components/common/StatCard`

## 4. Biểu đồ

Lấy màu từ `@/lib/chart-theme`, không bao giờ viết hex.

```tsx
import { seriesColor, axisProps, gridProps, tooltipProps, barRadius } from '@/lib/chart-theme';
```

Quy tắc bắt buộc:

1. **Gán màu theo thứ tự khe**: chuỗi thứ nhất `seriesColor(0)`, thứ hai
   `seriesColor(1)`… Không xoay vòng, không đổi màu khi bộ lọc làm giảm số chuỗi.
   Quá tám chuỗi thì gộp thành nhóm "Khác" hoặc tách thành nhiều biểu đồ nhỏ.
2. **Một trục duy nhất.** Không bao giờ vẽ hai đại lượng khác đơn vị lên cùng một
   biểu đồ (ví dụ số lượt ghi danh và tỷ lệ phần trăm). Tách thành hai biểu đồ,
   hoặc đưa một trong hai xuống bảng.
3. Từ hai chuỗi trở lên thì **luôn có chú giải**. Một chuỗi thì không cần —
   tiêu đề đã nói rõ.
4. Chữ trên trục, nhãn và chú giải mang màu chữ (`text-muted-foreground`), không
   bao giờ mang màu của chuỗi dữ liệu.
5. Không dùng màu trạng thái làm màu chuỗi dữ liệu.
6. Nét mảnh: đường 2px, lưới mờ, đầu cột bo 4px neo vào đường cơ sở.

## 5. Chế độ tối

Không viết biến thể `dark:` cho màu. Nếu đã dùng token thì chế độ tối tự đúng.
Chỉ dùng `dark:` cho những thứ token không diễn tả được, ví dụ độ mờ của ảnh.

## 6. Trước khi coi là xong

- Tìm trong tệp vừa sửa: không còn `gradient`, `#`, `slate-9`, `violet`, `white/`.
- Mở cả chế độ sáng và tối, kiểm tra chữ còn đọc được.
- Thẻ trên cùng một hàng phải cao bằng nhau và cùng một kiểu.
