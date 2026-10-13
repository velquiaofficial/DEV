@echo off
cd /d "%~dp0"
echo Starting 44_DECKLOOM on port 5644 ...
set PORT=5644
set VQ_OPEN=1
node server.js
pause
