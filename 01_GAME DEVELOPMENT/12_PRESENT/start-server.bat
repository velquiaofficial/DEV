@echo off
cd /d "%~dp0"
echo Starting 12_PRESENT on port 6167 ...
set PORT=6167
set VQ_OPEN=1
node server.js
pause
