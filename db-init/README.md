# db-init — lược đồ và dữ liệu cơ sở dữ liệu

## Cấu trúc

```
db-init/                 ← thư mục Flyway mount. CHỈ chứa migration.
  V1__baseline.sql
  README.md              (không phải .sql, Flyway bỏ qua)

db-archive/              ← NGOÀI tầm với của Flyway
  nguon/                 bản xuất thô từ SSMS
  lich-su/               V1..V10 cũ, giữ để tra cứu
```

## ⚠️ Đừng để tệp .sql nào trong thư mục con của `db-init/`

**Flyway quét ĐỆ QUY.** Bản dọn đầu tiên cất V1..V10 vào `db-init/_lich_su/`
với giả định sai rằng Flyway chỉ đọc cấp một. Kết quả:

```
ERROR: Found more than one migration with version 1
Offenders:
-> /flyway/sql/_lich_su/V1__init.sql (SQL)
-> /flyway/sql/_lich_su/V1__init.bak.sql (SQL)
```

Dấu gạch dưới đầu tên thư mục không có ý nghĩa gì với Flyway. Kho lưu trữ phải
nằm **ngoài** thư mục migration — đó là lý do có `db-archive/`.

`scripts/02-chay-migration.sh` nay kiểm điều này trước khi gọi Flyway và dừng
với thông báo rõ ràng nếu phát hiện, thay vì để Flyway báo lỗi khó hiểu.

## `V1__baseline.sql` là gì

Toàn bộ lịch sử migration V1→V10 đã được gộp thành **một** tệp lược đồ nền
(baseline). Nó chứa cả lược đồ lẫn dữ liệu:

| | |
|---|---|
| Bảng | 47 |
| Khóa ngoại | 88 |
| Chỉ mục | 86 |
| View | 2 |
| Hàng dữ liệu | 745 trên 43 bảng |

**ĐỪNG SỬA TAY TỆP NÀY.** Flyway lưu checksum của mỗi migration đã áp dụng và
sẽ từ chối chạy nếu nội dung đổi.

## Đổi lược đồ thì làm thế nào

### Cách thường dùng — viết migration mới

Tạo `V2__<mô_tả>.sql`, `V3__...` bên cạnh `V1__baseline.sql`. Flyway chạy theo
thứ tự số và chỉ chạy những bản chưa áp dụng. Đây là cách duy nhất an toàn khi
cơ sở dữ liệu đã có dữ liệu thật.

```sql
-- db-init/V2__add_storage_provider.sql
ALTER TABLE dbo.Lessons ADD StorageProvider VARCHAR(20) NOT NULL
    CONSTRAINT DF_Lessons_StorageProvider DEFAULT 'cloudinary';
GO
```

### Cách làm lại nền — chỉ khi chưa có dữ liệu thật ở đâu

1. Trong SSMS: chuột phải CSDL → Tasks → Generate Scripts → **Schema and data**
2. Lưu đè `db-archive/nguon/all_database_new.sql`
3. Sinh lại baseline:

```bash
python3 scripts/13-chuan-hoa-baseline.py \
    db-archive/nguon/all_database_new.sql \
    db-init/V1__baseline.sql
```

4. Xóa bảng `flyway_schema_history` trên **mọi** cơ sở dữ liệu đang có, rồi
   chạy lại migration từ đầu.

Muốn bản chỉ có lược đồ, không kèm dữ liệu demo:

```bash
python3 scripts/13-chuan-hoa-baseline.py --chi-luoc-do \
    db-archive/nguon/all_database_new.sql db-init/V1__baseline.sql
```

## Vì sao phải chạy qua script chuẩn hóa

Bản xuất của SSMS mô tả **toàn bộ instance SQL Server trên máy dev**, không
phải chỉ lược đồ ứng dụng. Trên RDS, tài khoản chủ không phải `sysadmin` nên
phần lớn những lệnh đó bị chặn. Script bỏ 43 lô:

| Lô bị bỏ | Số | Vì sao |
|---|---|---|
| `ALTER DATABASE ... SET ...` | 34 | RDS chặn (RECOVERY, TRUSTWORTHY, FILESTREAM...) và ghi cứng tên CSDL của máy dev |
| `USE [<db>]` | 3 | Flyway đã kết nối sẵn đúng CSDL; lệnh USE sẽ kéo mọi lệnh sau sang CSDL khác |
| `ALTER ROLE ... ADD MEMBER` | 2 | Trỏ tới user không tồn tại trên RDS |
| `CREATE DATABASE` | 1 | Chứa đường dẫn `D:\Download\...` của máy Windows cá nhân |
| Khối full-text | 1 | `sp_fulltext_database` cần `sysadmin` |
| `sp_db_vardecimal_storage_format` | 1 | Cần `sysadmin`, và vô nghĩa từ SQL Server 2016 |
| `CREATE USER ... FOR LOGIN` | 1 | Login đó không tồn tại trên RDS |

Kết quả không còn lệnh `USE` nào, nên tệp chạy được với **bất kỳ tên CSDL nào**
— `3t_edutech_db`, `ThreeTEduTechLMS`, gì cũng được.

## Trật tự trong tệp — đừng sắp xếp lại

SSMS xếp theo đúng thứ tự này, và nó quan trọng:

```
CREATE TABLE  →  INSERT dữ liệu  →  CREATE INDEX  →  DEFAULT  →  FOREIGN KEY
```

Dữ liệu được nạp **khi khóa ngoại chưa tồn tại**. Đó là lý do các lệnh INSERT
xếp theo bảng chữ cái mà vẫn không lỗi: lúc chèn `Orders` thì ràng buộc trỏ tới
`Accounts` chưa được tạo.

Hệ quả: **đừng tách phần dữ liệu ra một migration riêng chạy sau.** Lúc đó khóa
ngoại đã tồn tại và các lệnh INSERT sẽ hỏng hàng loạt. Script chuẩn hóa có sẵn
một phép kiểm chặn việc này — nó thoát với lỗi nếu phát hiện `INSERT` nằm sau
`FOREIGN KEY` đầu tiên.

## Kiểm thử trước khi chạy lên RDS

```bash
docker run -d --name thu-sql -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD='Thu@Nghiem123' \
  -e MSSQL_PID=Express -p 14333:1433 mcr.microsoft.com/mssql/server:2022-latest
sleep 30

docker run --rm --network host -v "$PWD/db-init:/flyway/sql:ro" flyway/flyway:10-alpine \
  -url="jdbc:sqlserver://localhost:14333;databaseName=master;encrypt=true;trustServerCertificate=true" \
  -user=sa -password='Thu@Nghiem123' \
  -mixed=true -placeholderReplacement=false migrate

docker rm -f thu-sql
```

Mất 3 phút và bắt được mọi lỗi cú pháp trước khi động vào RDS.

> `-placeholderReplacement=false` là bắt buộc — SQL có chuỗi dạng `${...}` và
> Flyway sẽ tưởng đó là biến của nó.

## ⚠️ Dữ liệu trong tệp có tài khoản thật

`V1__baseline.sql` chứa 11 hàng bảng `Accounts` với email thật và
`HashedPassword` từ máy dev, kèm `PasswordResetToken` và
`EmailVerificationToken`.

Sau khi migrate lên máy chủ công khai, **đổi mật khẩu các tài khoản quản trị**
qua giao diện. Ai biết mật khẩu dev là đăng nhập được vào production.

Nếu không muốn mang dữ liệu demo lên máy chủ, sinh lại baseline với
`--chi-luoc-do` — nhưng lúc đó trang web sẽ trống trơn, không có khóa học nào
để demo.
