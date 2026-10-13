@echo off
cd /d "%~dp0"
echo Starting 91_PERF_BUDGET on port 5691 ...
set PORT=5691
set VQ_OPEN=1
node server.js
pause
