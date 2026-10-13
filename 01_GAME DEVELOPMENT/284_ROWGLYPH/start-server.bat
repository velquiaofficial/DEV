@echo off
cd /d "%~dp0"
echo Starting 284_ROWSEAL on port 5384 ...
set PORT=5384
set VQ_OPEN=1
node server.js
pause
