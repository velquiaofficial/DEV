@echo off
cd /d "%~dp0"
echo Starting 206_PLOTPATCH on port 5306 ...
set PORT=5306
set VQ_OPEN=1
node server.js
pause
