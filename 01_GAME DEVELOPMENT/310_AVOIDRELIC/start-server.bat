@echo off
cd /d "%~dp0"
echo Starting 310_AVOIDDOCK on port 5410 ...
set PORT=5410
set VQ_OPEN=1
node server.js
pause
