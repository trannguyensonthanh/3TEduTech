# Flyway có cần không? Và đưa cơ sở dữ liệu lên RDS thế nào cho đúng

Trả lời ba câu hỏi bạn đặt ra:

1. *"Flyway hay bị lỗi, có cần thiết không?"*
2. *"SQL Server local của tôi đã gần đầy đủ bảng rồi, còn cần Flyway không?"*
3. *"Test trên DB local rồi thì RDS sẽ như nào? Có phải code riêng cho RDS không?"*

Câu trả lời ngắn cho câu 3 trước, vì nó là hiểu lầm cần gỡ ngay: **không, tuyệt
đối không code riêng cho RDS.** Cùng một tệp `.sql` chạy ở cả hai nơi — đó chính
là lý do Flyway tồn tại. Phần còn lại của tài liệu giải thích vì sao hiện tại
bạn *đang* phải xử lý riêng cho RDS, và cách chấm dứt chuyện đó.

---

## Phần 1 — Lỗi vừa gặp: thiếu đúng một dòng

```
ERROR: Migration V3__add_archive_submission.sql failed
Error Code : 4902
Message    : Cannot find the object "dbo.CourseApprovalRequests"
             because it does not exist or you do not have permissions.
```

Manh mối nằm ngay trong log, ở dòng phía trên:

```
Repair of failed migration in Schema History table [master].[dbo].[flyway_schema_history]
                                                    ^^^^^^^^
```

**Flyway đang làm việc trong `master`, không phải trong `ThreeTEduTechLMS`.**

Chuỗi kết nối trong `docker-compose.dev.yml` không có `databaseName`, nên nó rơi
vào CSDL mặc định của tài khoản `sa` — tức `master`. V1 tạo CSDL rồi tự `USE`
sang nó, nhưng **ngữ cảnh đó không kéo dài sang migration sau**: mỗi migration
là một lô lệnh mới, và ngữ cảnh quay về `master`.

Vì vậy mọi migration phải tự chuyển ngữ cảnh ở đầu tệp. Đối chiếu:

| Tệp | Có `USE [ThreeTEduTechLMS]`? |
|-----|------------------------------|
| V1 | `USE [master]` — đúng, nó phải bắt đầu ở master để tạo CSDL |
| V2 | ✅ dòng 3 |
| **V3** | ❌ **không có** ← thủ phạm |
| V4–V8 | ✅ |
| V10 | ❌ không có — **do tôi viết**, tôi bỏ nó đi ở bản viết lại hôm nay |

V3 là tệp duy nhất trong số các tệp bạn viết bị thiếu. Nó đi tìm
`dbo.CourseApprovalRequests` trong `master` — nơi bảng đó không tồn tại.

**Đã sửa:** thêm `USE [ThreeTEduTechLMS]; GO` vào đầu V3 và V10.

**Và chặn cả loại lỗi này:** `start.ps1` giờ có mục kiểm tra quét mọi tệp
`db-init/V*.sql` (trừ V1) và báo đỏ nếu tệp nào thiếu dòng đó. Lần sau bạn thêm
V11 mà quên, nó bắt được ngay lúc khởi động thay vì để Flyway đổ giữa chừng.

> Trên RDS thì `USE` là lệnh không làm gì — `scripts/02-chay-migration.sh` kết
> nối thẳng vào `ThreeTEduTechLMS`. Nên thêm dòng đó đúng ở cả hai môi trường.

---

## Phần 2 — Flyway có cần không?

### Câu trả lời thẳng

**Có** — nhưng vấn đề bạn đang gặp **không phải do Flyway**, và bỏ Flyway sẽ
không làm nó biến mất.

Hãy tách bạch hai công việc hoàn toàn khác nhau mà bạn đang gộp làm một:

| | Công việc | Tần suất | Công cụ đúng |
|---|---|---|---|
| **A** | Đưa lược đồ ban đầu lên một môi trường mới | **một lần** cho mỗi môi trường | Backup/restore, hoặc script sinh từ SSMS |
| **B** | Thay đổi lược đồ theo thời gian, giữ local và RDS khớp nhau | **liên tục**, mỗi lần sửa | Công cụ migration (Flyway) |

`V1__init.sql` của bạn là **công việc A đội lốt công việc B**. Nó là bản kết
xuất đầy đủ từ SSMS: 4045 dòng, 744 câu `INSERT`, kèm `CREATE DATABASE`,
`USE [master]`, và 33 lệnh `ALTER DATABASE ... SET` cấu hình cấp instance.

Đó là lý do — và là lý do duy nhất — bạn phải viết bộ lọc riêng cho RDS.

Ba lỗi bạn gặp trong hai ngày qua đều bắt nguồn từ chỗ này, không phải từ Flyway:

| Lỗi | Nguyên nhân gốc |
|-----|-----------------|
| Mật khẩu lệch → Flyway login failed | Cấu hình, không liên quan Flyway |
| V10 dùng `ALTER TABLE` trong `IF EXISTS` | SQL Server phân giải tên lúc biên dịch — lỗi T-SQL |
| V3 thiếu `USE` | Flyway kết nối vào `master` vì V1 phải tạo CSDL từ đó |

Cái thứ ba là hệ quả trực tiếp của việc V1 là một bản dump. Nếu lược đồ nền được
đưa lên bằng backup/restore và Flyway chỉ lo phần thay đổi về sau, thì Flyway
kết nối thẳng vào `ThreeTEduTechLMS` và **không migration nào cần `USE` nữa**.

### Nếu bỏ Flyway thì sao?

Bạn sẽ phải tự làm bằng tay ba việc mà nó đang làm:

- **Biết môi trường nào đã áp thay đổi nào.** Không có bảng lịch sử, bạn phải tự
  nhớ "RDS đã chạy script thêm cột `IsCompleted` chưa?". Với 10 script thì còn
  nhớ được; sau 6 tháng và 30 script thì không.
- **Chặn chạy hai lần.** `ALTER TABLE ADD COLUMN` chạy lần hai là lỗi. Bạn phải
  bọc `IF NOT EXISTS` quanh mọi thứ, mãi mãi.
- **Chặn thứ tự sai.** Script sửa bảng phải chạy sau script tạo bảng.

Và quan trọng nhất: **CI/CD không tự làm được.** Deploy sẽ luôn kèm một bước
"nhớ SSH vào chạy script" — thứ chắc chắn có ngày bị quên, và khi quên thì
backend mới chạy trên lược đồ cũ rồi đổ với `Invalid column name`.

> Với một đồ án một người làm, nghe có vẻ chịu được. Nhưng bạn đã có CI/CD tự
> động và hai môi trường (local + RDS) — đó chính xác là ngưỡng mà công cụ
> migration bắt đầu có lãi.

### Khi nào *thật sự* không cần Flyway

Chỉ khi có đúng một môi trường và bạn sửa CSDL trực tiếp bằng SSMS. Bạn không ở
trong trường hợp đó.

---

## Phần 3 — Ba cách đưa CSDL lên RDS

### Phương án A — Flyway chạy hết V1..V10 lên RDS *(đang dùng)*

`scripts/02-chay-migration.sh` lọc bỏ 14 lệnh RDS không cho phép khỏi một bản
sao tạm của V1, rồi chạy Flyway.

- ✅ Không cần thiết lập gì thêm trên AWS
- ✅ Đã viết xong và đã kiểm chứng trên tệp thật của bạn (744 câu `INSERT` giữ nguyên)
- ❌ Phụ thuộc vào một bộ lọc dựa trên biểu thức chính quy — thêm lệnh lạ vào V1
  là bộ lọc phải sửa theo
- ❌ Chép luôn cả 744 dòng dữ liệu mẫu lên production
- ❌ Nếu V1 có đối tượng mà RDS không hỗ trợ (linked server, CLR assembly,
  filegroup tùy chỉnh), nó vẫn đổ

### Phương án B — Backup/restore của RDS + Flyway `baseline` *(chuẩn production)*

Đây là cách AWS khuyến nghị để đưa một CSDL SQL Server lên RDS.

1. Backup CSDL local ra tệp `.bak`
2. Tải `.bak` lên S3
3. Gọi `msdb.dbo.rds_restore_database` trên RDS — AWS phục hồi nguyên vẹn
4. Chạy `flyway baseline -baselineVersion=10` để đánh dấu "V1..V10 đã có"
5. Từ V11 trở đi, Flyway chạy bình thường ở cả local lẫn RDS

**Yêu cầu chuẩn bị (làm một lần, ~20 phút):**

- Option group có bật tùy chọn `SQLSERVER_BACKUP_RESTORE`
- Một IAM role cho RDS truy cập S3
- Một S3 bucket **cùng vùng** với RDS (không hỗ trợ khác vùng)

**Giới hạn cần biết:**

- **Không phục hồi đè lên CSDL cùng tên.** Phải xóa CSDL cũ trước, hoặc phục hồi
  với tên khác.
- **Không phục hồi được log backup** trên RDS.
- Multi-AZ chỉ phục hồi được backup ở chế độ full recovery.
- Tối đa 2 tác vụ backup/restore chạy đồng thời.
- **RDS SQL Server Express giới hạn 10GB mỗi CSDL** — kiểm tra edition của bạn
  trước. CSDL của bạn hiện rất nhỏ (V1 chỉ 440KB SQL) nên không phải lo, nhưng
  nên biết trần ở đâu.

Ưu điểm lớn nhất: **cắt đứt hẳn nguồn lỗi.** Không còn bộ lọc, không còn
`ALTER DATABASE` bị chặn, không còn `USE [master]`, và Flyway từ đó chỉ làm đúng
việc nó giỏi — quản lý thay đổi tăng dần.

### Phương án C — Bỏ Flyway hoàn toàn

Không khuyến nghị. Lý do đã nêu ở Phần 2.

### So sánh

| | A (hiện tại) | B (khuyến nghị) | C (bỏ Flyway) |
|---|---|---|---|
| Thiết lập AWS thêm | không | S3 + IAM + option group | không |
| Thời gian làm lần đầu | 0 (đã xong) | ~40 phút | 0 |
| Rủi ro lỗi ở lần đầu | trung bình | thấp | thấp |
| Đồng bộ local ↔ RDS về sau | tự động | tự động | **thủ công** |
| CI/CD tự cập nhật lược đồ | ✅ | ✅ | ❌ |
| Phải nhớ đã chạy gì ở đâu | không | không | **có** |
| Dữ liệu mẫu lên production | có | tùy bạn chọn | — |

---

## Phần 4 — Khuyến nghị cho trường hợp của bạn

**Dùng phương án A ngay bây giờ, chuyển sang B khi có thời gian.**

Lý do: A đã viết xong, đã kiểm chứng, và lỗi V3 vừa rồi đã sửa. Bạn cần hệ thống
chạy được trước — đúng như bạn nói xuyên suốt dự án này. Bỏ 40 phút thiết lập
S3+IAM vào lúc chưa deploy được lần nào là đặt sai thứ tự ưu tiên.

Nhưng hãy chuyển sang B **trước khi có người dùng thật**, vì hai lý do:

1. Sau khi có dữ liệu thật, việc dựng lại CSDL từ V1 trở nên bất khả thi — mà
   phương án A phụ thuộc vào chính khả năng đó.
2. 744 dòng dữ liệu mẫu trong V1 sẽ nằm lẫn với dữ liệu thật.

### Nếu làm phương án B — các bước

```sql
-- 1. Trên SQL Server LOCAL: sao lưu (SSMS hoặc sqlcmd)
BACKUP DATABASE [ThreeTEduTechLMS]
TO DISK = 'C:\temp\3tedu.bak'
WITH FORMAT, INIT, COMPRESSION;
```

```bash
# 2. Tải lên S3 (cùng vùng ap-northeast-1 với RDS)
aws s3 cp C:\temp\3tedu.bak s3://ten-bucket-cua-ban/3tedu.bak --region ap-northeast-1
```

```sql
-- 3. Kết nối vào RDS bằng SSMS/sqlcmd, gọi thủ tục của AWS
EXEC msdb.dbo.rds_restore_database
    @restore_db_name = 'ThreeTEduTechLMS',
    @s3_arn_to_restore_from = 'arn:aws:s3:::ten-bucket-cua-ban/3tedu.bak';

-- Theo dõi tiến độ (phục hồi chạy bất đồng bộ)
EXEC msdb.dbo.rds_task_status @db_name = 'ThreeTEduTechLMS';
```

```bash
# 4. Đánh dấu baseline — bảo Flyway "V1..V10 đã có sẵn, đừng chạy lại"
docker run --rm -v /opt/3t-edu-tech/db-init:/flyway/sql:ro flyway/flyway:10-alpine \
  -url="jdbc:sqlserver://ENDPOINT:1433;databaseName=ThreeTEduTechLMS;encrypt=true;trustServerCertificate=true" \
  -user=admin -password='...' \
  -baselineVersion=10 \
  -baselineDescription="Phuc hoi tu ban sao luu local" \
  baseline
```

Sau bước 4, `scripts/02-chay-migration.sh` vẫn dùng được nguyên — nó sẽ thấy
lược đồ đã ở V10 và chỉ áp V11 trở đi. Lúc đó **bỏ được cả phần lọc SQL** trong
script, vì V1 không bao giờ chạy lại nữa.

---

## Phần 5 — Quy trình hằng ngày: local và RDS đồng bộ ra sao

Đây là câu trả lời cho *"test trên local rồi RDS sẽ như nào?"*

```
   Bạn cần thêm cột `PhoneNumber` vào bảng Accounts
                        │
                        ▼
   1. Viết db-init/V11__them_phone_number.sql
      (MỘT tệp, dùng cho CẢ HAI môi trường)
                        │
                        ▼
   2. .\start.bat            → Flyway áp V11 lên SQL Server trong Docker
                        │
                        ▼
   3. Test trên localhost:5173
                        │
                        ▼
   4. git push
                        │
                        ▼
   5. CI/CD tự chạy scripts/02-chay-migration.sh
      → Flyway áp V11 lên RDS
      → rồi mới đổi ảnh backend
                        │
                        ▼
   6. Xong. Hai môi trường cùng ở V11.
```

**Không có bước nào viết code riêng cho RDS.** Flyway đọc bảng
`flyway_schema_history` ở mỗi nơi, thấy nơi nào đang ở V10 thì áp V11, thấy nơi
nào đã ở V11 thì bỏ qua. Bạn không phải nhớ gì cả.

Điểm mấu chốt là **thứ tự ở bước 5**: migration chạy **trước** khi ảnh backend
mới lên. Nếu đảo lại, sẽ có một khoảng mã nguồn mới chạy trên lược đồ cũ và đổ
với `Invalid column name` cho mọi request.

### Thay đổi phá vỡ tương thích — làm hai bước

Với migration chỉ **thêm** (bảng mới, cột cho phép NULL), chạy trước là an toàn
tuyệt đối: mã cũ không biết tới thứ mới nên không bị ảnh hưởng.

Với **xóa** hoặc **đổi tên** cột thì không thứ tự nào an toàn cả. Phải chia hai
lần deploy:

```
Deploy 1:  V11 thêm cột `phone_number` (mới)
           Mã nguồn ghi vào CẢ HAI cột, đọc từ cột cũ
Deploy 2:  Mã nguồn đọc từ cột mới
Deploy 3:  V12 xóa cột cũ
```

Rườm rà, nhưng đó là cái giá của việc không có thời gian ngừng hệ thống. Với đồ
án, bạn hoàn toàn có thể chấp nhận ngừng vài phút và làm một lần — chỉ cần biết
là mình đang đánh đổi cái gì.

---

## Phần 6 — Bảy quy tắc viết migration để không lặp lại lỗi

Rút ra từ đúng những lỗi đã gặp trong dự án này:

**1. Luôn mở đầu bằng `USE [ThreeTEduTechLMS]; GO`**
Trừ V1. `start.ps1` đã có mục kiểm tra tự động cho quy tắc này.

**2. Không dùng `ALTER TABLE` bên trong `IF EXISTS`**
SQL Server phân giải tên đối tượng của `ALTER TABLE` **lúc biên dịch lô lệnh**,
trước khi `IF` được chạy. Bảng không tồn tại là cả lô đổ với `Msg 4902`, dù có
bọc `IF` hay không. `DROP TABLE` thì ngược lại — nó phân giải tên muộn, nên
`DROP TABLE IF EXISTS` an toàn.

Cần `ALTER TABLE` có điều kiện thì dùng SQL động:
```sql
IF OBJECT_ID('dbo.Bang','U') IS NOT NULL
    EXEC sp_executesql N'ALTER TABLE dbo.Bang DROP CONSTRAINT CK_Abc';
```

**3. Migration đã chạy thì KHÔNG sửa nữa**
Flyway lưu checksum. Sửa một tệp đã áp dụng sẽ chặn mọi lần chạy sau với
"checksum mismatch". Cần đổi thì viết tệp mới.

**4. Mỗi migration phải chạy lại được mà không lỗi**
Bọc `IF NOT EXISTS` quanh `ADD COLUMN`, `IF EXISTS` quanh `DROP`. Không phải vì
Flyway chạy lại — nó không chạy lại — mà vì có lúc bạn phải áp tay lên một CSDL
ở trạng thái nửa vời.

**5. Không đưa lệnh cấp instance vào migration**
`ALTER DATABASE ... SET RECOVERY`, `sp_fulltext_database`, `SET TRUSTWORTHY`:
RDS chặn hết. Chúng thuộc về cấu hình hạ tầng, không thuộc về lược đồ.

**6. Tách dữ liệu mẫu khỏi lược đồ**
Đặt seed data vào migration riêng (`R__seed_data.sql` — tiền tố `R` là
repeatable, chạy lại mỗi khi nội dung đổi), hoặc bỏ hẳn khỏi production.

**7. Không để tệp `.sql` trong thư mục con của `db-init`**
Flyway quét **theo chiều sâu**. Chuyển một migration vào `db-init/_to_delete/`
không hề gỡ nó ra khỏi Flyway — nó vẫn được áp dụng. `start.ps1` cũng đã có mục
kiểm tra cho cái bẫy này.

---

## Tóm lại

| Câu hỏi | Trả lời |
|---------|---------|
| Flyway hay lỗi, có cần không? | Cần. Ba lỗi vừa gặp đều không phải lỗi của Flyway — chúng đến từ việc V1 là bản dump SSMS chứ không phải migration. |
| Local đã đủ bảng rồi thì còn cần không? | Cần — cho **những thay đổi sau này**. Lược đồ hiện tại thì đưa lên RDS bằng backup/restore là gọn hơn. |
| Có phải code riêng cho RDS không? | **Không.** Cùng một tệp `.sql`. Việc phải lọc SQL hiện nay chỉ do V1 là dump; sau khi baseline thì hết. |
| Chuẩn production là gì? | Backup/restore để đưa lược đồ nền lên **một lần**, rồi công cụ migration lo phần thay đổi tăng dần. |

**Việc cần làm ngay:** chạy lại `.\start.bat`. Dev compose có `repair` trước
`migrate` nên nó tự dọn bản ghi V3 hỏng, rồi áp lại từ V3 đến V10.

---

**Nguồn tham khảo:**
- [Support for native backup and restore in SQL Server — AWS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Appendix.SQLServer.Options.BackupRestore.html)
- [Importing and exporting SQL Server databases using native backup and restore — AWS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/SQLServer.Procedural.Importing.html)
