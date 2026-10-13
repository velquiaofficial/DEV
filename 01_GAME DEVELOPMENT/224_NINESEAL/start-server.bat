@echo off
cd /d "%~dp0"
echo Starting 224_NINELOCK on port 5324 ...
set PORT=5324
set VQ_OPEN=1
node server.js
pause
