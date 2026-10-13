@echo off
cd /d "%~dp0"
echo Starting 312_SUMFORGE1 on port 5412 ...
set PORT=5412
set VQ_OPEN=1
node server.js
pause
