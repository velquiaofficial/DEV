@echo off
cd /d "%~dp0"
echo Starting 85_API_CATALOG on port 5685 ...
set PORT=5685
set VQ_OPEN=1
node server.js
pause
