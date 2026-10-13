@echo off
cd /d "%~dp0"
echo Starting 271_SLASHDECK on port 5371 ...
set PORT=5371
set VQ_OPEN=1
node server.js
pause
