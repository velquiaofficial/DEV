@echo off
cd /d "%~dp0"
echo Starting 20_WORKFLOW on port 5620 ...
set PORT=5620
set VQ_OPEN=1
node server.js
pause
