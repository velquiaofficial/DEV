@echo off
cd /d "%~dp0"
echo Starting 303_PATHSEAL on port 5403 ...
set PORT=5403
set VQ_OPEN=1
node server.js
pause
