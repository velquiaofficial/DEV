@echo off
cd /d "%~dp0"
echo Starting 132_BYTEFARM on port 5232 ...
set PORT=5232
set VQ_OPEN=1
node server.js
pause
