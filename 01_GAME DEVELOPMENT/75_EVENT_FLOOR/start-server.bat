@echo off
cd /d "%~dp0"
echo Starting 75_EVENT_FLOOR on port 5675 ...
set PORT=5675
set VQ_OPEN=1
node server.js
pause
