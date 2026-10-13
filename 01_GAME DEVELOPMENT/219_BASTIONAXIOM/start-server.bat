@echo off
cd /d "%~dp0"
echo Starting 219_BASTIONX on port 5319 ...
set PORT=5319
set VQ_OPEN=1
node server.js
pause
