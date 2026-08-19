<#
    doctor.ps1 — Chan doan nhanh khi co gi do khong on.

    [THÊM 18/08/2026]

    In ra dung nhung thu can nhin, khong phai ca bien log:
      - Trang thai container
      - Ket qua Flyway (migration)
      - Cac dong log KHOI DONG cua backend (bao gom loi neu co)
      - Bang cac worker da chay hay chua

    Dung:  .\doctor.bat
#>

$ErrorActionPreference = 'Continue'
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
$C = @('compose', '-f', 'docker-compose.dev.yml')

function Title ($t) { Write-Host "`n=== $t ===" -ForegroundColor Cyan }

Title 'Trang thai container'
& docker @C ps --format 'table {{.Service}}\t{{.Status}}'

Title 'Ket qua migration (Flyway)'
$fw = (& docker @C logs database-init 2>&1) -join "`n"
if ($fw -match 'Successfully applied (\d+) migration') {
    Write-Host "  [OK] Da ap dung $($Matches[1]) migration" -ForegroundColor Green
} elseif ($fw -match 'Schema .* is up to date|No migration necessary') {
    Write-Host '  [OK] Schema da day du, khong can migration moi' -ForegroundColor Green
} elseif ($fw -match 'ERROR') {
    Write-Host '  [LOI] Flyway bao loi:' -ForegroundColor Red
    ($fw -split "`n" | Select-String 'ERROR' | Select-Object -First 8) | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
} else {
    Write-Host '  [?] Khong doc duoc ket qua. Xem day du:' -ForegroundColor Yellow
    Write-Host '      docker compose -f docker-compose.dev.yml logs database-init' -ForegroundColor DarkGray
}

Title 'Log KHOI DONG cua backend'
$log = (& docker @C logs backend 2>&1) -join "`n"
$lines = $log -split "`n" | Select-String 'Khoi dong|Khởi động|CRON_JOB|Worker|Unhandled|Server listening|Database connected'
if ($lines) { $lines | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray } }
else { Write-Host '  (khong tim thay dong nao)' -ForegroundColor Yellow }

Title 'Cac worker cua tinh nang nhap khoa hoc'
$checks = @(
    @{ n = 'Worker nhap khoa hoc'; p = 'Worker nh.*p kh.*a h.*c' },
    @{ n = 'Worker tai video'    ; p = 'MediaUpload.*Worker' },
    @{ n = 'Cron don thu muc tam'; p = 'ImportCleanup' }
)
foreach ($c in $checks) {
    if ($log -match $c.p) { Write-Host "  [OK]  $($c.n)" -ForegroundColor Green }
    else { Write-Host "  [LOI] $($c.n) CHUA chay" -ForegroundColor Red }
}

Title 'Loi khoi dong (neu co)'
$errs = $log -split "`n" | Select-String 'TH.T B.I|FAILED|Unhandled'
if ($errs) {
    $errs | Select-Object -First 15 | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
} else {
    Write-Host '  Khong co loi khoi dong.' -ForegroundColor Green
}

Write-Host ''
