@echo off
cd /d "%~dp0"
echo Starting 54_BUG_TRIAGE on port 5654 ...
set PORT=5654
set VQ_OPEN=1
node server.js
pause
