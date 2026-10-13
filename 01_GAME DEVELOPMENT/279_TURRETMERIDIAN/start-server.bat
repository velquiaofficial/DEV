@echo off
cd /d "%~dp0"
echo Starting 279_TURRETLINE on port 5379 ...
set PORT=5379
set VQ_OPEN=1
node server.js
pause
