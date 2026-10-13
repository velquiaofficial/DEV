@echo off
cd /d "%~dp0"
echo Starting 246_SPRINTORB on port 5346 ...
set PORT=5346
set VQ_OPEN=1
node server.js
pause
