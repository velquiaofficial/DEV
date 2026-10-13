@echo off
cd /d "%~dp0"
echo Starting 78_CLINIC_FLOW on port 5678 ...
set PORT=5678
set VQ_OPEN=1
node server.js
pause
