@echo off
cd /d "%~dp0"
echo Starting 188_FROSTDECK on port 5288 ...
set PORT=5288
set VQ_OPEN=1
node server.js
pause
