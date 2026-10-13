@echo off
cd /d "%~dp0"
echo Starting 270_RUNPULSE on port 5370 ...
set PORT=5370
set VQ_OPEN=1
node server.js
pause
