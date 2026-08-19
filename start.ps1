<#
    start.ps1 — Khởi động toàn bộ hệ thống 3T EduTech ở chế độ phát triển,
                rồi TỰ KIỂM TRA từng lớp và báo cáo.

    [THÊM 18/08/2026]

    Cách dùng:
        .\start.ps1              # khởi động + kiểm tra
        .\start.ps1 -Rebuild     # build lại image (sau khi đổi Dockerfile/pyproject)
        .\start.ps1 -Reset       # XÓA SẠCH dữ liệu rồi chạy lại migration từ đầu
        .\start.ps1 -SkipChecks  # chỉ khởi động, không kiểm tra

    Vì sao là PowerShell chứ không phải .bat: cần đọc JSON trả về từ
    healthcheck và chờ dịch vụ sẵn sàng theo vòng lặp — .bat làm hai việc đó
    rất khổ sở.
#>

param(
    [switch]$Rebuild,
    [switch]$Reset,
    [switch]$SkipChecks
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

$Compose = @('compose', '-f', 'docker-compose.dev.yml')

# ── Tiện ích hiển thị ────────────────────────────────────────────────────────
function Write-Step  ($m) { Write-Host "`n=== $m ===" -ForegroundColor Cyan }
function Write-Ok    ($m) { Write-Host "  [OK]   $m" -ForegroundColor Green }
function Write-Fail  ($m) { Write-Host "  [LOI]  $m" -ForegroundColor Red }
function Write-Warn  ($m) { Write-Host "  [!]    $m" -ForegroundColor Yellow }
function Write-Info  ($m) { Write-Host "         $m" -ForegroundColor DarkGray }

$script:Failures = 0
function Check ($name, $ok, $detail) {
    if ($ok) { Write-Ok $name }
    else     { Write-Fail $name; if ($detail) { Write-Info $detail }; $script:Failures++ }
}

Write-Host @'

  ____ _____   _____    _       _____         _
 |___ /_   _| | ____|__| |_   _|_   _|__  ___| |__
   |_ \ | |   |  _| / _` | | | | | |/ _ \/ __| '_ \
  ___) || |   | |__| (_| | |_| | | |  __/ (__| | | |
 |____/ |_|   |_____\__,_|\__,_| |_|\___|\___|_| |_|

  Khoi dong moi truong phat trien
'@ -ForegroundColor Magenta

# ── 1. Kiểm tra điều kiện tiên quyết ─────────────────────────────────────────
Write-Step 'Kiem tra dieu kien tien quyet'

# Lenh native KHONG nem ngoai le khi that bai, nen try/catch o day la vo dung —
# phai xem $LASTEXITCODE. Day la cai bay kinh dien cua PowerShell.
$null = & docker version --format '{{.Server.Version}}' 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail 'Docker Desktop CHUA CHAY. Hay mo Docker Desktop roi thu lai.'
    exit 1
}
Write-Ok 'Docker Desktop dang chay'

foreach ($f in @('docker-compose.dev.yml', '3t-edu-tech-backend\.env', 'ai-service\.env')) {
    if (Test-Path $f) { Write-Ok "Co tep $f" }
    else { Write-Fail "THIEU tep $f"; exit 1 }
}

# Những biến mà thiếu thì tính năng chết âm thầm — kiểm tra ngay, đừng để phát
# hiện ra lúc bấm nút mới biết.
$beEnv = Get-Content '3t-edu-tech-backend\.env' -Raw
$aiEnv = Get-Content 'ai-service\.env' -Raw

Check 'backend/.env co AI_SERVICE_INTERNAL_KEY' ($beEnv -match '(?m)^AI_SERVICE_INTERNAL_KEY=\S') `
      'Thieu bien nay thi AI Service chay khong xac thuc.'
Check 'ai-service/.env co INTERNAL_API_KEY'     ($aiEnv -match '(?m)^INTERNAL_API_KEY=\S') `
      'Phai trung voi AI_SERVICE_INTERNAL_KEY ben backend.'
Check 'ai-service/.env co LLM_PROVIDER=gemini'  ($aiEnv -match '(?m)^LLM_PROVIDER=gemini') `
      'De "auto" khi chua co vLLM se lam moi luot goi cham them 3 giay.'
Check 'ai-service/.env co GEMINI_API_KEY'       ($aiEnv -match '(?m)^GEMINI_(CHAT_)?API_KEY=\S')

# Hai khóa phải TRÙNG NHAU — lệch nhau thì mọi lượt gọi AI trả 401, mà thông
# báo lỗi lại không nói rõ nguyên nhân.
if ($beEnv -match '(?m)^AI_SERVICE_INTERNAL_KEY=(\S+)') { $k1 = $Matches[1] } else { $k1 = '' }
if ($aiEnv -match '(?m)^INTERNAL_API_KEY=(\S+)')        { $k2 = $Matches[1] } else { $k2 = '' }
Check 'Hai khoa noi bo TRUNG NHAU' ($k1 -ne '' -and $k1 -eq $k2) `
      'Lech nhau thi moi luot goi AI se tra 401.'

# ★ Mat khau SQL Server phai dong bo giua backend va Flyway.
#
# docker-compose thay the ${MSSQL_SA_PASSWORD} tu .env O THU MUC GOC (hoac bien
# moi truong), con backend doc DB_PASSWORD tu 3t-edu-tech-backend/.env - hai
# cho khac han nhau. Lech nhau thi backend van ket noi BINH THUONG con Flyway
# LOGIN FAILED, va migration lang le khong duoc ap dung.
$rootEnv = if (Test-Path '.env') { Get-Content '.env' -Raw -Encoding UTF8 } else { '' }
if ($beEnv -match '(?m)^DB_PASSWORD=(.+?)\s*$') { $dbPass = $Matches[1] } else { $dbPass = '' }
if ($rootEnv -match '(?m)^MSSQL_SA_PASSWORD=(.+?)\s*$') { $saPass = $Matches[1] } else { $saPass = 'EduTech_Dev_2026!' }

Check 'Mat khau SQL Server dong bo (backend <-> Flyway)' ($dbPass -ne '' -and $dbPass -eq $saPass) `
      'Chay setup-env.bat de dong bo. Neu van hong: .\start.bat -Reset'

if ($script:Failures -gt 0) {
    Write-Host "`nCo $($script:Failures) van de o buoc cau hinh. Sua xong roi chay lai." -ForegroundColor Red
    exit 1
}

# ── 2. Khởi động ─────────────────────────────────────────────────────────────
if ($Reset) {
    Write-Step 'XOA SACH du lieu (down -v)'
    Write-Warn 'Toan bo du lieu SQL Server + Redis se bi xoa, migration chay lai tu dau.'
    $answer = Read-Host '  Go "XOA" de xac nhan'
    if ($answer -ne 'XOA') { Write-Info 'Da huy.'; exit 0 }
    & docker @Compose down -v
}

Write-Step 'Khoi dong cac dich vu'
$upArgs = @('up', '-d')
if ($Rebuild -or $Reset) { $upArgs += '--build' }
& docker @Compose @upArgs
if ($LASTEXITCODE -ne 0) { Write-Fail 'docker compose up that bai.'; exit 1 }

if ($SkipChecks) {
    Write-Host "`nDa khoi dong. Bo qua buoc kiem tra theo yeu cau." -ForegroundColor Green
    exit 0
}

# ── 3. Chờ sẵn sàng ──────────────────────────────────────────────────────────
# SQL Server mất khá lâu để khởi tạo lần đầu, và Flyway còn phải áp V1..V8.
# Chờ theo vòng lặp thay vì "sleep 60" cố định: máy nhanh thì xong sớm hơn nhiều.
function Wait-Url ($name, $url, $timeoutSec) {
    Write-Host "  Cho $name san sang" -NoNewline
    $deadline = (Get-Date).AddSeconds($timeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
            if ($r.StatusCode -eq 200) { Write-Host ' OK' -ForegroundColor Green; return $true }
        } catch { }
        Write-Host '.' -NoNewline
        Start-Sleep -Seconds 3
    }
    Write-Host ' QUA HAN' -ForegroundColor Red
    return $false
}

Write-Step 'Cho cac dich vu san sang'
Write-Info 'Lan dau co the mat 2-5 phut (SQL Server khoi tao + Flyway chay V1..V8).'

$beUp = Wait-Url 'Backend'    'http://localhost:5000/v1/'   300
$aiUp = Wait-Url 'AI Service' 'http://localhost:2111/health' 180
$feUp = Wait-Url 'Frontend'   'http://localhost:5173/'       120

# ── 4. Kiểm tra sâu ──────────────────────────────────────────────────────────
Write-Step 'Kiem tra tung lop'

# 4.1 Backend + DB + Redis
if ($beUp) {
    $h = Invoke-RestMethod 'http://localhost:5000/v1/' -TimeoutSec 10
    Check 'SQL Server ket noi duoc' ($h.services.database -eq 'connected')
    Check 'Redis ket noi duoc'      ($h.services.redis -eq 'connected') `
          'Mat Redis thi hang doi nhap khoa hoc KHONG chay duoc.'
    Write-Info "Trang thai tong: $($h.status)"
} else {
    Check 'Backend phan hoi' $false 'Xem log: docker compose -f docker-compose.dev.yml logs backend'
}

# 4.2 AI Service
if ($aiUp) {
    $a = Invoke-RestMethod 'http://localhost:2111/health' -TimeoutSec 10
    Check 'AI Service song' $true
    Check 'Dung Gemini (khong cho vLLM)' ($a.llm_provider -eq 'gemini') `
          "Dang la '$($a.llm_provider)'. Doi LLM_PROVIDER=gemini trong ai-service/.env."
    Write-Info "Model chat: $($a.models.chat) | embedding: $($a.models.embedding)"
} else {
    Check 'AI Service phan hoi' $false 'Xem log: docker compose -f docker-compose.dev.yml logs ai-service'
}

# 4.3 ★ Backend GỌI ĐƯỢC AI Service — phép thử quan trọng nhất.
# Đây đúng là đường đã hỏng suốt thời gian qua (127.0.0.1 tro ve chinh container
# backend). Neu buoc nay hong thi bóc PDF, viet mo ta, soan trac nghiem deu chet.
$code = & docker @Compose exec -T backend curl -s -o /dev/null -w '%{http_code}' http://ai-service:2111/health 2>$null
Check 'Backend goi duoc AI Service (mang noi bo Docker)' ($code -match '200') `
      "Nhan duoc '$code'. Kiem tra AI_SERVICE_URL trong docker-compose.dev.yml."

# 4.4 Khóa nội bộ có hiệu lực
$codeAuth = & docker @Compose exec -T backend curl -s -o /dev/null -w '%{http_code}' `
    -H "x-internal-api-key: $k1" http://ai-service:2111/api/extract/formats 2>$null
Check 'Backend qua duoc xac thuc noi bo' ($codeAuth -match '200') `
      "Nhan duoc '$codeAuth'. 401 = hai khoa lech nhau."

try {
    $codeNoAuth = (Invoke-WebRequest 'http://localhost:2111/api/extract/formats' -UseBasicParsing -TimeoutSec 5).StatusCode
} catch { $codeNoAuth = $_.Exception.Response.StatusCode.value__ }
Check 'Nguoi ngoai bi chan (401)' ($codeNoAuth -eq 401) `
      "Nhan duoc '$codeNoAuth'. Neu la 200 thi AI Service dang chay KHONG xac thuc."

# 4.5 Các endpoint mới của tính năng nhập khóa học
$importOk = $false
try {
    Invoke-WebRequest 'http://localhost:5000/v1/imports' -UseBasicParsing -TimeoutSec 5 | Out-Null
} catch {
    # 401 = route ton tai va dang doi dang nhap. Do la ket qua DUNG.
    $importOk = ($_.Exception.Response.StatusCode.value__ -eq 401)
}
Check 'Route /v1/imports da duoc mount' $importOk `
      'Neu 404 thi app.js chua nap imports.routes.'

# --- Flyway: migration da ap dung chua? ---
# Day la buoc DE BI BO SOT nhat: container database-init chay roi THOAT, khong
# ai nhin log cua no. Mot lan login failed la moi bang moi bien mat lang le.
#
# [SUA 18/08/2026] Khi that bai, IN LUON LY DO thay vi chi bao "co loi".
# Truoc day chi in mot dong "Xem: docker compose logs database-init" - dung
# nhung vo dung, vi nguoi doc van phai tu chay lenh do va tu doc 200 dong log.
$fwLog = (& docker @Compose logs database-init 2>&1) -join "`n"
$fwOk = ($fwLog -match 'Successfully applied \d+ migration' `
         -or $fwLog -match 'Schema .* is up to date' `
         -or $fwLog -match 'No migration necessary')
Check 'Flyway da ap dung migration' $fwOk 'Ly do cu the o ngay duoi day:'

if (-not $fwOk) {
    # Loc ra dung nhung dong dang gia tri. Log Flyway rat dai va phan lon la
    # banner quang cao cua Flyway Teams.
    $fwErr = ($fwLog -split "`n" | Where-Object {
        $_ -match 'ERROR|Caused by|Validate failed|Detected|Migration .* failed|SQL State|Error Code|Message\s*:'
    } | Select-Object -Last 12)

    if ($fwErr) {
        Write-Host '         --- Trich log Flyway ---' -ForegroundColor DarkYellow
        $fwErr | ForEach-Object { Write-Host "         $_" -ForegroundColor DarkYellow }
    } else {
        Write-Info 'Khong tim thay dong loi nao. 12 dong cuoi cua log:'
        ($fwLog -split "`n" | Select-Object -Last 12) |
            ForEach-Object { Write-Host "         $_" -ForegroundColor DarkGray }
    }

    # Ba nguyen nhan hay gap nhat, moi cai kem cach sua CU THE.
    if ($fwLog -match 'Detected applied migration not resolved locally') {
        Write-Info ''
        Write-Info 'NGUYEN NHAN: mot migration DA CHAY tren CSDL nhung tep .sql da bi xoa'
        Write-Info '(dung la truong hop cua V9__faq_knowledge_base.sql - da go bo co y).'
        Write-Info 'Cach sua: .\start.bat -Reset   (xoa volume, chay lai tu V1)'
        Write-Info 'Hoac chay repair thu cong:'
        Write-Info '  docker compose -f docker-compose.dev.yml run --rm database-init repair'
    }
    if ($fwLog -match 'checksum mismatch|Migration checksum mismatch') {
        Write-Info ''
        Write-Info 'NGUYEN NHAN: mot tep migration DA CHAY roi bi SUA noi dung.'
        Write-Info 'Flyway chan lai vi khong con biet chac luoc do dang o trang thai nao.'
        Write-Info 'Cach sua o DEV: .\start.bat -Reset'
    }
    if ($fwLog -match 'Login failed for user') {
        Write-Info ''
        Write-Fail 'Flyway LOGIN FAILED - mat khau khong khop voi SQL Server.'
        Write-Info 'Volume CSDL cu giu mat khau tu LAN KHOI TAO DAU TIEN; doi bien'
        Write-Info 'moi truong sau do KHONG doi mat khau cua CSDL da ton tai.'
        Write-Info 'Cach sua: .\start.bat -Reset  (xoa volume, tao lai tu dau)'
    }
}

# --- Thu muc db-init co tep .sql lac cho khong? ---
# [THEM 18/08/2026] Flyway quet thu muc migration DE QUY.
#
# Nghia la mot tep .sql nam trong THU MUC CON (vi du db-init/_to_delete/ hay
# db-init/backup/) VAN DUOC AP DUNG. Day la cai bay that: chuyen mot migration
# vao thu muc con de "tam bo di" khong he go no ra khoi Flyway.
$straySql = @(Get-ChildItem -Path (Join-Path $ProjectRoot 'db-init') -Filter '*.sql' -Recurse -File -ErrorAction SilentlyContinue |
              Where-Object { $_.DirectoryName -ne (Join-Path $ProjectRoot 'db-init') })
Check 'Khong co tep .sql lac trong thu muc con cua db-init' ($straySql.Count -eq 0) `
      "Flyway quet DE QUY nen cac tep sau VAN duoc ap dung: $($straySql.Name -join ', ')"

# --- Moi migration co chuyen dung ngu canh CSDL khong? ---
# [THEM 18/08/2026] Chan lai CA MOT LOAI LOI, khong phai mot lan.
#
# Flyway o dev ket noi vao CSDL mac dinh cua `sa`, tuc `master` (chuoi ket noi
# trong docker-compose.dev.yml khong co `databaseName`). V1 tao CSDL roi tu
# `USE` sang no, nhung ngu canh do KHONG keo dai sang migration sau.
#
# Nghia la migration nao thieu `USE [ThreeTEduTechLMS]` o dau tep se chay tren
# `master` va do voi "Cannot find the object ... because it does not exist".
# Dung loi da xay ra voi V3.
#
# V1 la ngoai le hop le: no BAT DAU o master de tao CSDL.
$migThieuUse = @()
Get-ChildItem -Path (Join-Path $ProjectRoot 'db-init') -Filter 'V*.sql' -File |
    Where-Object { $_.Name -notlike 'V1__*' } |
    ForEach-Object {
        $noiDung = Get-Content $_.FullName -Raw -Encoding UTF8
        if ($noiDung -notmatch '(?im)^\s*USE\s*\[?ThreeTEduTechLMS') {
            $migThieuUse += $_.Name
        }
    }
Check 'Moi migration deu co USE [ThreeTEduTechLMS]' ($migThieuUse.Count -eq 0) `
      "Thieu o: $($migThieuUse -join ', ') -> se chay tren master va do voi loi 4902."

# --- Endpoint FAQ tra ve 200 chua? ---
# [SUA 18/08/2026] Doi ten check va doi han y nghia.
#
# Bang FAQs KHONG con ton tai va do la CO Y - noi dung FAQ nay nam trong ma
# nguon (src/api/faqs/faqs.data.js), khong con bang CSDL nao ca. Check cu ten
# la "Bang FAQs ton tai (migration V9)" nen khi that bai no chi ra sai huong:
# nguoi doc di lung suc bang FAQs va log Flyway, trong khi loi that nam o tang
# service.
try {
    $faqCode = (Invoke-WebRequest 'http://localhost:5000/v1/faqs' -UseBasicParsing -TimeoutSec 10).StatusCode
} catch { $faqCode = $_.Exception.Response.StatusCode.value__ }
Check 'Endpoint /v1/faqs tra ve 200' ($faqCode -eq 200) `
      "Nhan duoc '$faqCode'. FAQ doc tu ma nguon chu KHONG tu CSDL, nen 500 o day KHONG lien quan toi Flyway - xem log backend."

# 4.6 Worker đã khởi động
$log = (& docker @Compose logs --tail 400 backend 2>$null) -join "`n"
Check 'Worker nhap khoa hoc da chay'  ($log -match 'Worker nh.*p kh.*a h.*c|\[Import\].*Worker') `
      'Khong thay dong log khoi dong worker.'
Check 'Worker tai video da chay'      ($log -match 'MediaUpload') `
      'Khong thay dong log khoi dong worker tai video.'
Check 'Khong co loi khoi dong nghiem trong' (-not ($log -match 'Failed to connect to the database')) `
      'Backend khong ket noi duoc SQL Server.'

# ── 5. Tổng kết ──────────────────────────────────────────────────────────────
Write-Host ''
Write-Host ('=' * 62) -ForegroundColor DarkGray

if ($script:Failures -eq 0) {
    Write-Host ' TAT CA DEU DAT. He thong san sang.' -ForegroundColor Green
    Write-Host ''
    Write-Host '  Frontend    http://localhost:5173'  -ForegroundColor White
    Write-Host '  Backend     http://localhost:5000/v1/' -ForegroundColor White
    Write-Host '  AI Service  http://localhost:2111/docs' -ForegroundColor White
    Write-Host ''
    Write-Host '  Thu tinh nang nhap khoa hoc:' -ForegroundColor Cyan
    Write-Host '    Dang nhap tai khoan giang vien' -ForegroundColor DarkGray
    Write-Host '    -> Khoa hoc cua toi -> "Nhap Tu Tep ZIP"' -ForegroundColor DarkGray
    Write-Host '    -> Keo tha khoa-hoc-mau.zip o thu muc goc du an' -ForegroundColor DarkGray
    Start-Process 'http://localhost:5173'
} else {
    Write-Host " CO $($script:Failures) MUC KHONG DAT." -ForegroundColor Red
    Write-Host ''
    Write-Host '  Xem log chi tiet:' -ForegroundColor Yellow
    Write-Host '    docker compose -f docker-compose.dev.yml logs -f backend ai-service' -ForegroundColor DarkGray
    Write-Host '  Xem muc 7 trong docs/HUONG_DAN_CHAY_LOCAL.md de xu ly su co.' -ForegroundColor Yellow
}
Write-Host ('=' * 62) -ForegroundColor DarkGray
Write-Host ''
