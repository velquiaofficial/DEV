@echo off
cd /d "%~dp0"
echo Starting 293_KNOWWAVE on port 5393 ...
set PORT=5393
set VQ_OPEN=1
node server.js
pause
