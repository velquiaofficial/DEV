@echo off
cd /d "%~dp0"
echo Starting 90_A11Y_AUDIT on port 5690 ...
set PORT=5690
set VQ_OPEN=1
node server.js
pause
