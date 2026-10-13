@echo off
cd /d "%~dp0"
echo Starting 10_FASHION on port 6748 ...
set PORT=6748
set VQ_OPEN=1
node server.js
pause
