@echo off
cd /d "%~dp0"
echo Starting 53_LOCALE_PACK on port 5653 ...
set PORT=5653
set VQ_OPEN=1
node server.js
pause
