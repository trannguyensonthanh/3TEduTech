> ⚠️ **BẢN NÀY ĐÃ CŨ (24/08/2026).** Phân tích bên dưới viết khi
> `all_database_new.sql` còn là bản chỉ có lược đồ, không kèm dữ liệu — nên nó
> đề xuất tách riêng `V2__seed_reference_data.sql`. Bản xuất SSMS sau đó đã kèm
> đủ 745 hàng dữ liệu, và tệp seed riêng không còn cần nữa (đã chuyển vào
> `db-init/_lich_su/`).
>
> **Tài liệu đang có hiệu lực: [`db-init/README.md`](../db-init/README.md).**
> Giữ tệp này lại vì phần giải thích *vì sao* bản xuất SSMS không chạy được
> trên RDS vẫn đúng nguyên.

---

# Gộp V1–V10 thành một tệp — được, nhưng không phải bản đang có

> Viết ngày 24/08/2026. Trả lời câu hỏi: tại sao phải chạy một đống V1..V10
> thay vì chạy thẳng `all_database_new.sql` cho nhanh.

---

## Câu trả lời ngắn

**Ý tưởng của bạn đúng, và với RDS đang rỗng thì nó còn là cách nên làm.** Việc
gộp toàn bộ lịch sử migration thành một tệp lược đồ duy nhất có tên riêng trong
nghề: **baseline** (hoặc schema consolidation). Flyway hỗ trợ sẵn, không phải
mẹo vặt.

**Nhưng `all_database_new.sql` ở dạng hiện tại chạy trên RDS là hỏng ngay lệnh
thứ ba**, và kể cả sửa xong phần đó thì nó vẫn dựng lên một cơ sở dữ liệu mà
ứng dụng không chạy được. Sáu vấn đề cụ thể ở mục 3.

Tôi đã sinh ra bản sửa: `db-init/V1__baseline.sql` và
`db-init/V2__seed_reference_data.sql`.

---

## 1. Vì sao migration lại chia thành nhiều bản — và khi nào thì không cần

Chuỗi V1..V10 giải một bài toán: **cập nhật một cơ sở dữ liệu ĐANG CÓ DỮ LIỆU
mà không mất dữ liệu đó.** Khi máy dev của bạn đã ở V7 và bạn viết V8, Flyway
đọc bảng `flyway_schema_history`, thấy V8 chưa chạy, và chỉ chạy V8.

Nếu thay bằng một tệp "lược đồ đúng nhất", Flyway sẽ gặp `CREATE TABLE Accounts`
trên một CSDL đã có bảng `Accounts` → lỗi ngay. Muốn dùng một tệp thì phải xóa
sạch CSDL trước — tức là mất hết dữ liệu.

**Điều đó không áp dụng cho RDS của bạn.** Nó rỗng, chưa có gì để mất. Với một
CSDL rỗng thì chạy 10 tệp hay 1 tệp cho ra kết quả y hệt nhau, và 1 tệp thì:

- nhanh hơn (không phải `ALTER TABLE` đi `ALTER TABLE` lại cùng một bảng)
- dễ đọc hơn — nhìn một chỗ là biết lược đồ cuối cùng ra sao
- ít chỗ hỏng hơn — V4 tên là `fix_missing_migrations`, tức là chuỗi này đã
  từng lệch một lần rồi

Cái giá phải trả, và nó có thật:

| Mất gì | Ảnh hưởng tới bạn |
|---|---|
| Không cập nhật được CSDL đang có dữ liệu | Máy dev của bạn phải tạo lại từ đầu một lần |
| Mất lịch sử "vì sao có cột này" | V5, V8 có chú thích giải thích quyết định thiết kế — đừng xóa các tệp cũ, chuyển chúng vào `db-init/_lich_su/` |
| Vẫn phải dùng migration cho thay đổi SAU này | Baseline chỉ gộp quá khứ. Từ mai, thay đổi mới vẫn là V3, V4, V5... |

> Điểm cuối là chỗ hay bị hiểu nhầm nhất. Gộp một lần **không** có nghĩa là bỏ
> Flyway. Tệp gộp phải chính là một migration có đánh số (`V1__baseline.sql`),
> để Flyway ghi nhận nó vào `flyway_schema_history` và các bản sau vẫn chạy
> đúng thứ tự. Chạy tay ngoài Flyway thì lần deploy sau bạn sẽ không biết CSDL
> đang ở trạng thái nào.

---

## 2. Bản gộp có đúng nội dung không — kiểm rồi

Tôi so `all_database_new.sql` với trạng thái cuối của chuỗi V1..V10:

| Kiểm tra | Kết quả |
|---|---|
| Tập bảng | **Khớp tuyệt đối** — 47 bảng cả hai bên, không thừa không thiếu |
| 3 bảng FAQ mà V10 xóa | Đã không còn trong bản gộp ✅ |
| 10 cột do V2–V8 thêm | Có đủ cả 10 ✅ |
| View `vw_CourseFamilyStats` (V5) | Có ✅ |
| View `vw_CourseChatInsights` (V7) | Có ✅ |
| Khóa ngoại | 88 (bản gộp) so với 78 (chỉ V1) — đúng, phần chênh là của V2–V8 |
| Chỉ mục | 86 so với 77 — tương tự |

**Về mặt lược đồ, bản gộp là chính xác.** Đây là tin tốt và cũng là điều kiện
cần để làm tiếp.

> Ghi chú lặt vặt: chuỗi hiện tại nhảy từ V8 sang V10, không có V9. Flyway
> không đòi số liên tục nên nó vẫn chạy, nhưng nếu có ai đó từng viết V9 rồi
> xóa đi thì nên biết là nó biến đi đâu.

---

## 3. Sáu lý do bản hiện tại chưa dùng được

`all_database_new.sql` là bản kết xuất thô của SSMS "Script Database as CREATE".
Tùy chọn đó mô tả **toàn bộ instance SQL Server trên máy bạn**, không phải chỉ
lược đồ ứng dụng. Trên RDS, tài khoản chủ không phải `sysadmin`, nên phần lớn
những gì SSMS thêm vào đều bị chặn.

### 3.1 🔴 Đường dẫn tệp của máy Windows cá nhân

```sql
CREATE DATABASE [ThreeTEduTechLMS]
 ON PRIMARY (NAME = N'ThreeTEduTechLMS',
   FILENAME = N'D:\Download\appName\SQL server\...\ThreeTEduTechLMS.mdf', ...)
```

RDS không cho chỉ định đường dẫn tệp `.mdf`/`.ldf` — nó tự quản lý hoàn toàn.
Lệnh này hỏng chắc chắn, và nó là lệnh thứ ba trong tệp.

### 3.2 🔴 Tên cơ sở dữ liệu ghi cứng — mà lại sai tên

Tệp nhắc `[ThreeTEduTechLMS]` **48 lần**. Nhưng `.env.production` của bạn đang
đặt `DB_NAME=3t_edutech_db` — đúng cái tên hiện ra trong log lỗi migration hôm
trước:

```
CSDL    : 3t_edutech_db
```

Chạy tệp này sẽ tạo ra một cơ sở dữ liệu **khác** với cái mà ứng dụng kết nối
tới. Backend sẽ báo `Invalid object name` trên mọi bảng, và bạn sẽ đi tìm lỗi ở
chỗ hoàn toàn không liên quan.

### 3.3 🔴 34 lệnh `ALTER DATABASE` cấp instance

`SET RECOVERY FULL`, `SET TRUSTWORTHY`, `SET FILESTREAM`, `SET DISABLE_BROKER`,
`SET TARGET_RECOVERY_TIME`, `SET ACCELERATED_DATABASE_RECOVERY`, `SET MULTI_USER`,
`SET READ_WRITE` — RDS chặn hết. Số còn lại (`ANSI_*`, `COMPATIBILITY_LEVEL`)
thì RDS cho phép nhưng chúng lại ghi cứng tên CSDL sai ở 3.2.

### 3.4 🔴 Khối full-text cần quyền `sysadmin`

```sql
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [ThreeTEduTechLMS].[dbo].[sp_fulltext_database] @action = 'enable'
end
```

Ứng dụng không có `CREATE FULLTEXT INDEX` ở đâu cả — đây thuần túy là phần SSMS
luôn sinh ra.

### 3.5 🔴 Tạo user cho một login không tồn tại

```sql
CREATE USER [ThreeTEduTechLMS_AppUser] FOR LOGIN [ThreeTEduTechLMS_AppUser]
ALTER ROLE [db_datareader] ADD MEMBER [ThreeTEduTechLMS_AppUser]
```

Login đó có trên SQL Server ở máy bạn, không có trên RDS → `Cannot find the
login`. Ứng dụng kết nối bằng tài khoản chủ của RDS nên không cần user này.

### 3.6 🔴 Không có dữ liệu tham chiếu — và đây mới là vấn đề lớn nhất

`all_database_new.sql` có **0 lệnh INSERT**. SSMS mặc định xuất lược đồ không
kèm dữ liệu, nên mọi bảng tra cứu được tạo ra **rỗng**.

Nghe thì nhẹ, nhưng:

```sql
-- trong bảng Courses:
REFERENCES [dbo].[CourseStatuses] ([StatusID])
```

`CourseStatuses` rỗng nghĩa là **mọi lệnh thêm khóa học đều hỏng vì vi phạm
khóa ngoại**. Và lỗi hiện ra ở tầng ứng dụng, xa chỗ gây ra nó — kiểu lỗi tốn
cả buổi để lần ngược.

**Điều đáng nói hơn: chuỗi V1..V10 hiện tại cũng bị y hệt.** `V1__init.sql`
(bản đang dùng, 113KB) cũng có 0 INSERT. Chỉ `V1__init.bak.sql` (440KB, bản cũ)
mới có 810 lệnh INSERT. Nghĩa là:

> Cả hai đường — chạy 10 tệp hay chạy 1 tệp — hiện đều dựng lên một cơ sở dữ
> liệu mà ứng dụng không chạy được. Chưa ai phát hiện vì máy dev còn giữ dữ
> liệu từ hồi bản `.bak` còn là `V1`.

Đây là lỗi có sẵn, không phải do ý tưởng gộp tệp của bạn gây ra. Nhưng nếu
không xử lý thì deploy lên RDS sẽ đâm thẳng vào nó.

---

## 4. Đã sửa gì

### `scripts/13-chuan-hoa-baseline.py`

Biến bản kết xuất SSMS thành migration chạy được trên RDS. Viết thành script
chứ không sửa tay một lần, vì bạn sẽ xuất lại từ SSMS nữa — lần đầu sửa tay
127KB thì được, tới lần thứ ba là bắt đầu sót.

Nó cắt theo **lô `GO`** chứ không theo dòng. Bản `02-chay-migration.sh` cũ lọc
theo dòng, đúng với lệnh một dòng nhưng khối full-text trải ba dòng và
`CREATE DATABASE` trải bảy dòng — lọc theo dòng để lại mảnh vỡ. Cắt theo lô thì
mỗi lô là một lệnh trọn vẹn: bỏ hoặc giữ cả lô.

```
$ python3 scripts/13-chuan-hoa-baseline.py db-init/all_database_new.sql db-init/V1__baseline.sql

Nguồn : all_database_new.sql  (121 KB, 648 lô)
Đích  : db-init/V1__baseline.sql  (119 KB)

Đã loại bỏ:
    34 lô   ALTER DATABASE
     3 lô   USE <db>
     2 lô   ALTER ROLE ADD MEMBER
     1 lô   CREATE DATABASE
     1 lô   full-text
     1 lô   sp_db_vardecimal
     1 lô   CREATE USER/LOGIN

Kiểm tra tệp kết quả:
   ✅ không còn lệnh nào RDS chặn, không còn tên CSDL ghi cứng
   47 CREATE TABLE giữ nguyên
```

Script tự kiểm lại tệp nó vừa sinh, và thoát với mã lỗi nếu số bảng về 0.

### `db-init/V1__baseline.sql`

Lược đồ nền: 47 bảng, 88 khóa ngoại, 2 view, 605 lô. **Không có lệnh `USE`** —
Flyway đã kết nối sẵn vào đúng CSDL, nên tệp chạy được với bất kỳ tên nào
(`3t_edutech_db`, `ThreeTEduTechLMS`, gì cũng được). Đây là thứ giải quyết 3.2
một cách gọn nhất: không phải thay tên, mà là **bỏ hẳn chỗ cần tên**.

### `db-init/V2__seed_reference_data.sql`

100 hàng dữ liệu tham chiếu, trích tự động từ `V1__init.bak.sql`:

| Bảng | Hàng | | Bảng | Hàng |
|---|---|---|---|---|
| Roles | 4 | | PaymentStatuses | 5 |
| Currencies | 2 | | PayoutStatuses | 5 |
| Languages | 2 | | PaymentMethods | 7 |
| Levels | 4 | | Settings | 13 |
| Categories | 8 | | ExchangeRates | 15 |
| Skills | 29 | | CourseStatuses | 6 |

Thứ tự trong tệp **có ý nghĩa**: `Currencies` phải nạp trước `ExchangeRates`
(có khóa ngoại trỏ tới). Tôi đã kiểm — mọi giá trị `ExchangeRates` trỏ tới đều
nằm trong `Currencies` được seed.

Ba điểm về thiết kế tệp này:

- **Chỉ có dữ liệu tham chiếu, không có dữ liệu demo.** Không Accounts, không
  Courses, không Orders. Những thứ đó là dữ liệu thử của máy dev, không nên có
  trên production.
- **Chạy lại được.** Mỗi khối có `IF NOT EXISTS (SELECT 1 FROM <bảng>)` bao
  ngoài. Bảng nào đã có hàng thì bỏ qua nguyên khối — cố ý, để nó không đè lên
  chỉnh sửa của người vận hành.
- **`IDENTITY_INSERT` cho 4 bảng dùng khóa tự tăng** (Levels, Categories,
  Skills, ExchangeRates), để ID giữ nguyên đúng giá trị mà dữ liệu khác tham
  chiếu tới.

---

## 5. Làm gì tiếp

### 5.1 Dọn thư mục `db-init`

```bash
cd db-init
mkdir -p _lich_su
git mv V1__init.sql V2__add_enrollment_columns.sql V3__add_archive_submission.sql \
       V4__fix_missing_migrations.sql V5__course_versioning.sql V6__certificates.sql \
       V7__chat_history.sql V8__protect_student_data.sql V10__drop_faq_tables.sql \
       V1__init_test.sql V1__init.bak.sql _lich_su/
```

**Chuyển vào `_lich_su/`, đừng xóa.** V5 và V8 có chú thích giải thích quyết
định thiết kế (vì sao có trạng thái `SUPERSEDED`, dữ liệu học viên được bảo vệ
thế nào) — đó là thứ bạn sẽ cần khi viết phần thiết kế CSDL trong báo cáo.

Flyway chỉ đọc thư mục được trỏ tới, không đệ quy vào thư mục con, nên
`_lich_su/` nằm đó không ảnh hưởng gì. Sau bước này `db-init/` còn đúng hai tệp
Flyway thấy: `V1__baseline.sql` và `V2__seed_reference_data.sql`.

### 5.2 Kiểm thử trên máy dev TRƯỚC, đừng thử thẳng trên RDS

```bash
docker run -d --name thu-sql -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD='Thu@Nghiem123' \
  -p 14333:1433 mcr.microsoft.com/mssql/server:2022-latest

docker run --rm --network host -v "$PWD/db-init:/flyway/sql:ro" flyway/flyway:10-alpine \
  -url="jdbc:sqlserver://localhost:14333;databaseName=master;encrypt=true;trustServerCertificate=true" \
  -user=sa -password='Thu@Nghiem123' \
  -mixed=true -placeholderReplacement=false migrate
```

> `-placeholderReplacement=false` là bắt buộc: SQL có chuỗi dạng `${...}` và
> Flyway sẽ tưởng đó là biến của nó.

Mất 3 phút, và nó bắt được mọi lỗi cú pháp trước khi bạn động vào RDS.

### 5.3 Chạy thật

```bash
sudo bash scripts/02-chay-migration.sh
```

Script đó vẫn dùng được nguyên. Phần lọc SQL bên trong nó giờ **thừa** — tệp
baseline đã sạch rồi — nhưng để lại cũng vô hại: nó sẽ báo "Đã lọc bỏ 0 lệnh".

### 5.4 Từ đây trở đi

Thay đổi lược đồ mới → viết `V3__<mô_tả>.sql`, `V4__...`. **Đừng sửa
`V1__baseline.sql`** — Flyway lưu checksum của mỗi tệp đã chạy và sẽ từ chối
migrate nếu tệp đã áp dụng bị đổi nội dung.

Muốn gộp lại lần nữa trong tương lai (khi V3..V20 lại nhiều quá) thì lặp lại
đúng quy trình này: xuất SSMS → chạy `13-chuan-hoa-baseline.py` → xóa
`flyway_schema_history` trên mọi CSDL → chạy lại từ đầu. Chỉ làm khi chưa có
dữ liệu thật ở đâu.

---

## 6. Còn chuyện cột `storage_provider`

Bạn nói tạm dựa vào cấu trúc đường dẫn để phân biệt tệp nằm ở Cloudinary hay
S3. Chạy được, và với giai đoạn chưa có người dùng thì đó là đánh đổi hợp lý.

Chỗ nó gãy: đường dẫn Cloudinary có dạng
`https://res.cloudinary.com/<cloud>/video/upload/...`, và bạn phân biệt bằng
tiền tố `res.cloudinary.com`. Nhưng nếu sau này Cloudinary đổi tên miền CDN,
hoặc bạn bật custom domain, hoặc chuyển một tệp từ S3 về Cloudinary — thì logic
đó sai âm thầm, không báo lỗi, chỉ là video không phát được.

Thêm cột lúc này rẻ hơn nhiều lần so với lúc đã có dữ liệu thật:

```sql
-- db-init/V3__add_storage_provider.sql
ALTER TABLE dbo.Lessons ADD StorageProvider VARCHAR(20) NOT NULL
    CONSTRAINT DF_Lessons_StorageProvider DEFAULT 'cloudinary';
GO
```

Không gấp. Nhưng khi nào bạn viết migration tiếp theo thì thêm luôn thể.
