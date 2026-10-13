@echo off
cd /d "%~dp0"
echo Starting 139_LEAFRAID on port 5239 ...
set PORT=5239
set VQ_OPEN=1
node server.js
pause
