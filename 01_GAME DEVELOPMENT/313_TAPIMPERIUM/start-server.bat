@echo off
cd /d "%~dp0"
echo Starting 313_TAPFORGE1 on port 5413 ...
set PORT=5413
set VQ_OPEN=1
node server.js
pause
