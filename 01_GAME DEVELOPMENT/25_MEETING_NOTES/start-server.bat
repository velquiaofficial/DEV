@echo off
cd /d "%~dp0"
echo Starting 25_MEETING_NOTES on port 5625 ...
set PORT=5625
set VQ_OPEN=1
node server.js
pause
