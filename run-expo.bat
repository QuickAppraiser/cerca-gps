@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo    CERCA GPS - Starting Expo Server
echo ========================================
echo.
echo Opening web browser at http://localhost:8081
echo.
echo To test on mobile:
echo   1. Install Expo Go on your phone
echo   2. Scan the QR code that appears
echo.
echo Press Ctrl+C to stop the server
echo.
npx expo start --web
pause
