@echo off
cd /d "%~dp0"
echo Starting 200_LEAFSUDO on port 5300 ...
set PORT=5300
set VQ_OPEN=1
node server.js
pause
