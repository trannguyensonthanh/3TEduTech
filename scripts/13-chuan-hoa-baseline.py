#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
13-chuan-hoa-baseline.py — Biến bản kết xuất SSMS thành migration chạy được trên RDS

[THÊM 24/08/2026]

★ VÌ SAO CẦN SCRIPT NÀY THAY VÌ SỬA TAY MỘT LẦN

Bạn sẽ kết xuất lại từ SSMS nữa — mỗi lần đổi lược đồ trên máy dev là một lần
xuất lại. Sửa tay 127KB SQL lần đầu thì được; tới lần thứ ba là bắt đầu sót.
Script này chạy lại được, cho ra kết quả giống hệt nhau, và nói rõ nó đã bỏ gì.

★ NÓ BỎ NHỮNG GÌ, VÀ VÌ SAO

SSMS "Script Database as CREATE" sinh ra một tệp mô tả TOÀN BỘ instance, không
phải chỉ lược đồ ứng dụng. Trên RDS, tài khoản chủ KHÔNG phải sysadmin nên phần
lớn những lệnh cấp instance đó bị chặn:

  1. USE [master] / USE [<db>]
     Flyway đã kết nối sẵn vào đúng cơ sở dữ liệu. Một lệnh USE ở đây sẽ kéo
     mọi lệnh sau nó sang CSDL khác — và vì tên CSDL bị ghi cứng theo máy dev
     (ThreeTEduTechLMS) nên nó có thể trỏ vào một CSDL không tồn tại trên RDS.

  2. CREATE DATABASE ... ON PRIMARY (FILENAME = N'D:\\Download\\...')
     Đường dẫn tệp .mdf/.ldf của máy Windows cá nhân. RDS không cho chỉ định
     đường dẫn tệp — nó tự quản lý. Lệnh này chắc chắn hỏng.

  3. ALTER DATABASE ... SET ...
     RDS chặn RECOVERY, TRUSTWORTHY, FILESTREAM, DISABLE_BROKER,
     TARGET_RECOVERY_TIME, ACCELERATED_DATABASE_RECOVERY, MULTI_USER,
     READ_WRITE... Những tùy chọn còn lại (ANSI_*, COMPATIBILITY_LEVEL) thì RDS
     cho phép NHƯNG chúng ghi cứng tên CSDL của máy dev — nên bỏ hết cho gọn.
     Mặc định của RDS đã đúng với engine 16.00.

  4. Khối full-text (sp_fulltext_database)
     Cần quyền sysadmin. Ứng dụng không dùng CREATE FULLTEXT INDEX ở đâu cả —
     đây chỉ là phần SSMS luôn sinh ra.

  5. CREATE USER [..._AppUser] FOR LOGIN [..._AppUser]
     Login đó tồn tại trên SQL Server ở máy bạn, không tồn tại trên RDS. Lệnh
     này hỏng với "Cannot find the login". Ứng dụng kết nối bằng tài khoản chủ
     của RDS nên không cần user này.

★ CÁCH LÀM: CẮT THEO LÔ `GO`, KHÔNG PHẢI THEO DÒNG

Bản 02-chay-migration.sh cũ lọc theo từng dòng. Cách đó đúng với các lệnh một
dòng, nhưng khối full-text trải ba dòng và CREATE DATABASE trải bảy dòng — lọc
theo dòng sẽ để lại mảnh vỡ. Cắt theo lô `GO` thì mỗi lô là một lệnh trọn vẹn:
bỏ hoặc giữ nguyên cả lô, không có nửa vời.

★ VỀ PHẦN DỮ LIỆU — VÌ SAO GIỮ NGUYÊN THỨ TỰ CỦA SSMS

Bản xuất "Schema and data" của SSMS xếp theo đúng thứ tự này:

    CREATE TABLE  →  INSERT dữ liệu  →  CREATE INDEX  →  DEFAULT  →  FOREIGN KEY

Dữ liệu được nạp KHI KHÓA NGOẠI CHƯA TỒN TẠI. Đó là lý do thứ tự các lệnh
INSERT (SSMS xếp theo bảng chữ cái) không gây lỗi: lúc chèn `Orders` thì ràng
buộc trỏ tới `Accounts` chưa được tạo.

Hệ quả: **đừng tách phần dữ liệu ra một migration riêng chạy sau V1.** Lúc đó
khóa ngoại đã tồn tại, và các lệnh INSERT xếp theo bảng chữ cái sẽ hỏng hàng
loạt. Script này vì vậy giữ nguyên trật tự lô của SSMS, không sắp xếp lại gì.

Nếu muốn một cơ sở dữ liệu SẠCH (chỉ lược đồ, không dữ liệu demo) thì dùng cờ
`--chi-luoc-do` — nó bỏ toàn bộ lô INSERT.

CÁCH DÙNG
    # lược đồ + dữ liệu (mặc định)
    python3 scripts/13-chuan-hoa-baseline.py \\
        db-archive/nguon/all_database_new.sql \\
        db-init/V1__baseline.sql

    # chỉ lược đồ, không dữ liệu
    python3 scripts/13-chuan-hoa-baseline.py --chi-luoc-do \\
        db-archive/nguon/all_database_new.sql \\
        db-init/V1__baseline.sql
"""

import re
import sys

# --- Các lô bị loại, kèm lý do để in ra cho người chạy đọc -------------------
LOAI_BO = [
    ("USE <db>",              re.compile(r"^\s*USE\s+\[?\w+\]?\s*$", re.I | re.M)),
    ("CREATE DATABASE",       re.compile(r"^\s*CREATE\s+DATABASE\b", re.I | re.M)),
    ("ALTER DATABASE",        re.compile(r"^\s*ALTER\s+DATABASE\b", re.I | re.M)),
    ("full-text",             re.compile(r"FULLTEXTSERVICEPROPERTY|sp_fulltext_database", re.I)),
    ("CREATE USER/LOGIN",     re.compile(r"^\s*CREATE\s+USER\b", re.I | re.M)),
    ("ALTER ROLE ADD MEMBER", re.compile(r"^\s*ALTER\s+ROLE\b.*\bADD\s+MEMBER\b", re.I | re.M)),
    ("CREATE LOGIN",          re.compile(r"^\s*CREATE\s+LOGIN\b", re.I | re.M)),
    ("sp_addextendedproperty",re.compile(r"sp_addextendedproperty", re.I)),
    ("BACKUP/RESTORE",        re.compile(r"^\s*(BACKUP|RESTORE)\b", re.I | re.M)),
    # sp_db_vardecimal_storage_format cần quyền sysadmin và cũng ghi cứng tên
    # CSDL của máy dev. Nó là di tích từ SQL Server 2008; với SQL Server 2016
    # trở lên thì lệnh này không còn tác dụng gì.
    ("sp_db_vardecimal",      re.compile(r"sp_db_vardecimal_storage_format", re.I)),
    ("sp_configure/RECONFIGURE", re.compile(r"^\s*(EXEC(UTE)?\s+)?sp_configure\b|^\s*RECONFIGURE\b", re.I | re.M)),
    ("CREATE ASSEMBLY/CERT",  re.compile(r"^\s*CREATE\s+(ASSEMBLY|CERTIFICATE|MASTER\s+KEY)\b", re.I | re.M)),
    ("ALTER AUTHORIZATION",   re.compile(r"^\s*ALTER\s+AUTHORIZATION\b", re.I | re.M)),
]

DAU_TEP = """\
/* =============================================================================
   V1__baseline.sql — Lược đồ nền, sinh tự động. ĐỪNG SỬA TAY TỆP NÀY.

   Nguồn : {nguon}
   Sinh bởi: scripts/13-chuan-hoa-baseline.py

   Muốn đổi lược đồ thì làm MỘT trong hai:
     • Thay đổi nhỏ  → viết V2__..., V3__... mới. Đây là cách thường dùng.
     • Làm lại nền   → xuất lại từ SSMS, chạy lại script chuẩn hóa, VÀ xóa
                       bảng flyway_schema_history trên mọi CSDL đang có.
                       Chỉ làm khi chưa có dữ liệu thật ở đâu cả.

   Tệp này KHÔNG có lệnh USE — Flyway đã kết nối sẵn vào đúng cơ sở dữ liệu,
   nên lược đồ chạy được với bất kỳ tên CSDL nào (3t_edutech_db, ThreeTEduTechLMS...).
   ============================================================================= */

"""


LA_DU_LIEU = re.compile(r"^\s*(INSERT|SET\s+IDENTITY_INSERT)\b", re.I | re.M)


def chuan_hoa(sql: str, ten_nguon: str, chi_luoc_do: bool = False):
    # SSMS xuất ra với BOM và xuống dòng CRLF; chuẩn hóa trước khi cắt lô.
    sql = sql.replace("\r\n", "\n").lstrip("\ufeff")

    # Cắt theo `GO` đứng riêng một dòng. `GO` KHÔNG phải câu lệnh T-SQL mà là
    # dấu phân lô của công cụ khách — nên nó luôn nằm trên dòng riêng và có thể
    # cắt bằng regex an toàn.
    lo = re.split(r"^\s*GO\s*$", sql, flags=re.I | re.M)

    giu, thong_ke, so_lo_du_lieu = [], {}, 0
    for khoi in lo:
        if not khoi.strip():
            continue
        ly_do = next((ten for ten, pat in LOAI_BO if pat.search(khoi)), None)
        if ly_do:
            thong_ke[ly_do] = thong_ke.get(ly_do, 0) + 1
            continue
        if LA_DU_LIEU.search(khoi):
            if chi_luoc_do:
                thong_ke["lô dữ liệu (--chi-luoc-do)"] = thong_ke.get("lô dữ liệu (--chi-luoc-do)", 0) + 1
                continue
            so_lo_du_lieu += 1
        giu.append(khoi.strip())

    than = "\nGO\n\n".join(giu) + "\nGO\n"
    ghi_chu = (
        "   Nội dung: LƯỢC ĐỒ, KHÔNG có dữ liệu (--chi-luoc-do)"
        if chi_luoc_do
        else f"   Nội dung: lược đồ + {so_lo_du_lieu} lô dữ liệu, giữ nguyên trật tự SSMS"
    )
    dau = DAU_TEP.format(nguon=ten_nguon).replace("   Sinh bởi:", ghi_chu + "\n   Sinh bởi:")
    return dau + than, thong_ke, len(lo), so_lo_du_lieu


def main():
    tham_so = [a for a in sys.argv[1:] if not a.startswith("--")]
    chi_luoc_do = "--chi-luoc-do" in sys.argv

    if len(tham_so) != 2:
        print(__doc__)
        sys.exit(1)

    nguon, dich = tham_so
    goc = open(nguon, encoding="utf-8-sig", errors="strict").read()
    ket_qua, thong_ke, tong_lo, so_lo_du_lieu = chuan_hoa(
        goc, nguon.replace("\\", "/").split("/")[-1], chi_luoc_do
    )

    with open(dich, "w", encoding="utf-8", newline="\n") as f:
        f.write(ket_qua)

    print(f"Nguồn : {nguon}  ({len(goc)//1024} KB, {tong_lo} lô)")
    print(f"Đích  : {dich}  ({len(ket_qua)//1024} KB)")
    print("\nĐã loại bỏ:")
    if thong_ke:
        for ten, n in sorted(thong_ke.items(), key=lambda kv: -kv[1]):
            print(f"   {n:>4} lô   {ten}")
    else:
        print("   (không có lô nào bị loại — kiểm lại xem nguồn có đúng là bản SSMS không)")

    # Kiểm tra lại kết quả: không được còn sót thứ gì RDS chặn.
    # Chỉ soi phần THÂN, bỏ qua khối chú thích đầu tệp — nếu không thì chính
    # dòng chú thích nhắc tên CSDL cũng bị báo là còn sót.
    than_kq = ket_qua[len(DAU_TEP.format(nguon=nguon)):]
    print("\nKiểm tra tệp kết quả:")
    con_sot = False
    for ten, pat in LOAI_BO:
        n = len(pat.findall(than_kq))
        if n:
            print(f"   ⚠️  còn {n} chỗ khớp '{ten}' — XEM LẠI")
            con_sot = True
    n_ghi_cung = len(re.findall(r"ThreeTEduTechLMS", than_kq))
    if n_ghi_cung:
        print(f"   ⚠️  còn {n_ghi_cung} chỗ ghi cứng tên CSDL của máy dev — XEM LẠI")
        con_sot = True
    if not con_sot:
        print("   ✅ không còn lệnh nào RDS chặn, không còn tên CSDL ghi cứng")

    n_bang = len(re.findall(r"CREATE\s+TABLE", ket_qua, re.I))
    n_fk = len(re.findall(r"FOREIGN\s+KEY", ket_qua, re.I))
    n_insert = len(re.findall(r"^\s*INSERT\b", ket_qua, re.I | re.M))
    print(f"   {n_bang} CREATE TABLE, {n_fk} FOREIGN KEY, {n_insert} INSERT")
    if n_bang == 0:
        print("   ⚠️  KHÔNG CÒN BẢNG NÀO — chắc chắn có gì đó sai, đừng dùng tệp này")
        sys.exit(1)

    # Kiểm trật tự: mọi lô dữ liệu phải nằm TRƯỚC lô khóa ngoại đầu tiên.
    # Nếu sai trật tự này thì migration sẽ hỏng vì vi phạm khóa ngoại, và đó là
    # loại lỗi rất khó đọc ra từ thông báo của Flyway.
    if n_insert:
        vi_tri_insert_cuoi = max(m.start() for m in re.finditer(r"^\s*INSERT\b", ket_qua, re.I | re.M))
        m_fk = re.search(r"FOREIGN\s+KEY", ket_qua, re.I)
        if m_fk and m_fk.start() < vi_tri_insert_cuoi:
            print("   ⚠️  CÓ LỆNH INSERT NẰM SAU KHÓA NGOẠI ĐẦU TIÊN — sẽ hỏng khi chạy.")
            print("       Xuất lại từ SSMS với 'Schema and data', đừng ghép tay.")
            sys.exit(1)
        print("   ✅ mọi lệnh INSERT nằm trước khóa ngoại — trật tự an toàn")

    # Cảnh báo về dữ liệu nhạy cảm đi kèm bản xuất.
    n_tk = len(re.findall(r"INSERT\s+\[dbo\]\.\[Accounts\]", ket_qua, re.I))
    if n_tk:
        print(f"\n   ⚠️  Tệp chứa {n_tk} tài khoản kèm HashedPassword và email thật.")
        print("       Sau khi migrate lên máy chủ, ĐỔI MẬT KHẨU tài khoản quản trị.")


if __name__ == "__main__":
    main()
