@echo off
cd /d "%~dp0"
echo Starting 51_DIALOG_BENCH on port 5651 ...
set PORT=5651
set VQ_OPEN=1
node server.js
pause
