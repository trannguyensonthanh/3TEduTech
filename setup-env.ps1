<#
    setup-env.ps1 — Bổ sung các biến môi trường còn thiếu vào hai tệp .env.

    [THÊM 18/08/2026]

    Chạy MỘT LẦN duy nhất, trước lần khởi động đầu tiên:
        .\setup-env.ps1

    An toàn khi chạy lại nhiều lần: script kiểm tra biến đã tồn tại chưa, có
    rồi thì bỏ qua. Nội dung .env cũ được giữ nguyên hoàn toàn — chỉ NỐI THÊM
    vào cuối tệp, và có sao lưu .env.bak trước khi ghi.
#>

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Add-EnvBlock ($path, $sentinel, $block) {
    if (-not (Test-Path $path)) {
        Write-Host "  [LOI] Khong tim thay $path" -ForegroundColor Red
        return $false
    }

    $text = Get-Content $path -Raw -Encoding UTF8

    if ($text -match "(?m)^$sentinel=") {
        Write-Host "  [BO QUA] $path da co $sentinel" -ForegroundColor DarkGray
        return $true
    }

    # Sao lưu trước khi đụng vào — .env chứa toàn bộ khóa thật của bạn.
    Copy-Item $path "$path.bak" -Force

    if (-not $text.EndsWith("`n")) { $text += "`r`n" }
    # Ghi KHONG kem BOM: dotenv cua Node va pydantic-settings deu coi BOM la
    # mot phan cua ten bien dau tien -> bien do khong bao gio duoc doc ra.
    [System.IO.File]::WriteAllText(
        (Resolve-Path $path),
        $text + $block,
        (New-Object System.Text.UTF8Encoding($false))
    )
    Write-Host "  [DA THEM] $path (sao luu tai $path.bak)" -ForegroundColor Green
    return $true
}

Write-Host "`n=== Bo sung bien moi truong ===" -ForegroundColor Cyan

$AI_BLOCK = @'

# =============================================================================
# [THEM 18/08/2026] Cau hinh cho Level 3 + Nhap khoa hoc tu ZIP
# =============================================================================

# "gemini" = luon dung Gemini API. Dung khi chua co GPU server (vLLM/Qwen).
# DUNG de "auto" khi chua co vLLM: moi luot goi mat them 3 giay cho do vLLM
# roi moi roi xuong Gemini - cham ma chang duoc gi.
LLM_PROVIDER=gemini

# Khoa noi bo (Level 3). PHAI TRUNG voi AI_SERVICE_INTERNAL_KEY ben backend.
INTERNAL_API_KEY=WLBCDkZLaIrdhdFiliKt0p8FDcZahFJm

# Whisper: may co RTX 3050 nhung chay CUDA trong Docker/Windows can them
# GPU passthrough qua WSL2. Giu CPU cho chac; xem muc 10 trong huong dan.
WHISPER_MODEL_SIZE=small
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
'@

$BE_BLOCK = @'

# =============================================================================
# [THEM 18/08/2026] Cau hinh cho Level 2/3 + Nhap khoa hoc tu ZIP
# =============================================================================

# Khoa noi bo (Level 3). PHAI TRUNG voi INTERNAL_API_KEY ben ai-service.
AI_SERVICE_INTERNAL_KEY=WLBCDkZLaIrdhdFiliKt0p8FDcZahFJm

# Chu ky HMAC cho chung chi (Level 2). Thieu thi he thong tu dung tam
# JWT_SECRET va ghi canh bao. Dat rieng de doi JWT_SECRET sau nay khong
# lam hong nhung chung chi da cap.
CERTIFICATE_SECRET=MKLnr2dNrhhJ6RjQrQzQ20F5WRHo1huS

# Gioi han tan suat - noi rong trong giai doan TEST.
# Mac dinh 5 luot tai ZIP/gio va 10 luot goi AI/gio: hop ly khi dung that,
# nhung rat de cham tran khi dang thu nghiem. Ha lai truoc khi deploy.
RATE_LIMIT_IMPORT_MAX=50
RATE_LIMIT_IMPORT_ENRICH_MAX=50
'@

$ok1 = Add-EnvBlock 'ai-service\.env'           'INTERNAL_API_KEY'        $AI_BLOCK
$ok2 = Add-EnvBlock '3t-edu-tech-backend\.env'  'AI_SERVICE_INTERNAL_KEY' $BE_BLOCK

# =============================================================================
# ĐỒNG BỘ MẬT KHẨU SQL SERVER
# =============================================================================
#
# ★ LOI DA GAP THAT: Flyway khong chay duoc migration vi dung SAI MAT KHAU.
#
# docker-compose.dev.yml viet:
#     MSSQL_SA_PASSWORD=${MSSQL_SA_PASSWORD:-EduTech_Dev_2026!}
#
# Bien ${MSSQL_SA_PASSWORD} duoc Docker Compose thay the tu (a) bien moi truong
# cua shell, hoac (b) tep .env o THU MUC GOC du an. Khong co ca hai thi dung
# mac dinh 17 ky tu o tren.
#
# Trong khi do backend doc DB_PASSWORD tu 3t-edu-tech-backend/.env - mot cho
# HOAN TOAN KHAC. Hai gia tri lech nhau la:
#
#     backend  -> ket noi BINH THUONG  (dung mat khau that cua CSDL)
#     Flyway   -> LOGIN FAILED         (dung mac dinh cua compose)
#
# Va vi Flyway chay roi thoat, khong ai de y, nen migration LANG LE khong duoc
# ap dung. Bang moi khong bao gio xuat hien, con ung dung thi van chay ngon
# lanh - cho toi luc goi trung endpoint dung bang do.
#
# ⚠️ Vi sao lech duoc dau tien: MSSQL_SA_PASSWORD chi co tac dung o LAN KHOI
#    TAO DAU TIEN cua volume. Doi bien nay sau do KHONG doi mat khau cua CSDL
#    da ton tai - container nhan bien moi nhung ben trong van la mat khau cu.
#
# Script nay ghi mat khau tu backend/.env sang .env goc de ca hai cung mot
# nguon. KHONG in mat khau ra man hinh.
# =============================================================================

Write-Host "`n=== Dong bo mat khau SQL Server ===" -ForegroundColor Cyan

$bePath = '3t-edu-tech-backend\.env'
if (Test-Path $bePath) {
    $beText = Get-Content $bePath -Raw -Encoding UTF8
    if ($beText -match '(?m)^DB_PASSWORD=(.+?)\s*$') {
        $dbPass = $Matches[1]

        $rootEnv = '.env'
        $rootText = if (Test-Path $rootEnv) { Get-Content $rootEnv -Raw -Encoding UTF8 } else { '' }

        if ($rootText -match '(?m)^MSSQL_SA_PASSWORD=(.+?)\s*$') {
            if ($Matches[1] -eq $dbPass) {
                Write-Host '  [BO QUA] .env goc da co MSSQL_SA_PASSWORD trung khop' -ForegroundColor DarkGray
            } else {
                $rootText = $rootText -replace '(?m)^MSSQL_SA_PASSWORD=.*$', "MSSQL_SA_PASSWORD=$dbPass"
                [System.IO.File]::WriteAllText((Resolve-Path $rootEnv), $rootText,
                    (New-Object System.Text.UTF8Encoding($false)))
                Write-Host '  [DA SUA] .env goc: MSSQL_SA_PASSWORD gio khop voi DB_PASSWORD' -ForegroundColor Green
                Write-Host '           ⚠️ Volume CSDL cu van giu mat khau CU. Neu Flyway van' -ForegroundColor Yellow
                Write-Host '              login failed, chay:  .\start.bat -Reset' -ForegroundColor Yellow
            }
        } else {
            $header = @"
# =============================================================================
# .env o THU MUC GOC - chi danh cho Docker Compose thay the bien `${...}`
# KHONG phai .env cua backend hay ai-service.
#
# MSSQL_SA_PASSWORD duoc DUNG CHUNG boi hai service:
#   - `database`      : mat khau tai khoan sa cua SQL Server
#   - `database-init` : mat khau Flyway dung de chay migration
#
# No PHAI trung voi DB_PASSWORD trong 3t-edu-tech-backend/.env, neu khong
# Flyway se login failed va migration LANG LE khong duoc ap dung.
# =============================================================================
"@
            if ($rootText -and -not $rootText.EndsWith("`n")) { $rootText += "`r`n" }
            $rootText += "$header`r`nMSSQL_SA_PASSWORD=$dbPass`r`n"
            [System.IO.File]::WriteAllText((Join-Path (Get-Location) $rootEnv), $rootText,
                (New-Object System.Text.UTF8Encoding($false)))
            Write-Host '  [DA TAO] .env goc voi MSSQL_SA_PASSWORD khop DB_PASSWORD' -ForegroundColor Green
            Write-Host '           ⚠️ Volume CSDL cu van giu mat khau CU. Neu Flyway van' -ForegroundColor Yellow
            Write-Host '              login failed, chay:  .\start.bat -Reset' -ForegroundColor Yellow
        }
    } else {
        Write-Host '  [LOI] Khong tim thay DB_PASSWORD trong backend/.env' -ForegroundColor Red
    }
} else {
    Write-Host "  [LOI] Khong tim thay $bePath" -ForegroundColor Red
}

if ($ok1 -and $ok2) {
    Write-Host "`nXong. Gio chay:  .\start.bat -Rebuild`n" -ForegroundColor Green
} else {
    Write-Host "`nCo tep khong xu ly duoc. Xem muc 2 trong docs/HUONG_DAN_CHAY_LOCAL.md de them tay.`n" -ForegroundColor Yellow
}
