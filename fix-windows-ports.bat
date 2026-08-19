@echo off

:: Check for Administrator privileges
openfiles >nul 2>&1
if '%errorlevel%' NEQ '0' (
    echo Requesting Administrator privileges from Windows... Please click YES on the popup!
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /B
)

echo.
echo ==============================================================================
echo [1/3] Stopping Windows NAT Service (winnat) to release Hyper-V locked ports...
net stop winnat

echo.
echo [2/3] Adding permanent protection for Port 5173 (Frontend) and Port 5000 (Backend)...
netsh int ipv4 add excludedportrange protocol=tcp startport=5173 numberofports=1
netsh int ipv4 add excludedportrange protocol=tcp startport=5000 numberofports=1

echo.
echo [3/3] Restarting Windows NAT Service (winnat)...
net start winnat

echo.
echo ==============================================================================
echo SUCCESS! Ports 5173 and 5000 are unlocked and permanently protected!
echo You can now return to VS Code and run: npm run dev
echo ==============================================================================
timeout /t 5
