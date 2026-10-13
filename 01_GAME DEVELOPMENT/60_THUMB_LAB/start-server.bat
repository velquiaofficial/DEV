@echo off
cd /d "%~dp0"
echo Starting 60_THUMB_LAB on port 5660 ...
set PORT=5660
set VQ_OPEN=1
node server.js
pause
