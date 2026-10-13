@echo off
cd /d "%~dp0"
echo Starting 150_SANDLINE on port 5250 ...
set PORT=5250
set VQ_OPEN=1
node server.js
pause
