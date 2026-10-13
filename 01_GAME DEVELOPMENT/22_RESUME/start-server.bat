@echo off
cd /d "%~dp0"
echo Starting 22_RESUME on port 5622 ...
set PORT=5622
set VQ_OPEN=1
node server.js
pause
