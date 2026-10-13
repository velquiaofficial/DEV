@echo off
cd /d "%~dp0"
echo Starting 238_DODGECORE on port 5338 ...
set PORT=5338
set VQ_OPEN=1
node server.js
pause
