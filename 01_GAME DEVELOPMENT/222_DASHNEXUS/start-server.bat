@echo off
cd /d "%~dp0"
echo Starting 222_DASHCORE on port 5322 ...
set PORT=5322
set VQ_OPEN=1
node server.js
pause
