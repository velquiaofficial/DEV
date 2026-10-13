@echo off
cd /d "%~dp0"
echo Starting 26_EMAIL_SALES on port 5626 ...
set PORT=5626
set VQ_OPEN=1
node server.js
pause
