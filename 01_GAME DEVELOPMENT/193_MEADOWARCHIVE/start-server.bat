@echo off
cd /d "%~dp0"
echo Starting 193_MEADOWDECK on port 5293 ...
set PORT=5293
set VQ_OPEN=1
node server.js
pause
