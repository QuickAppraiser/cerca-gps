@echo off
cd /d "%~dp0"
echo Starting CERCA app...
echo.
echo Opening at http://localhost:8081
echo.
call npx expo start --web
pause
