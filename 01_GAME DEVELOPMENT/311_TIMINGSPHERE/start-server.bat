@echo off
cd /d "%~dp0"
echo Starting 311_TIMINGPOD on port 5411 ...
set PORT=5411
set VQ_OPEN=1
node server.js
pause
