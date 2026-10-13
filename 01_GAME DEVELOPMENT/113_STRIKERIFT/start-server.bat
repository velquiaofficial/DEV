@echo off
cd /d "%~dp0"
echo Starting 113_WHACKBURST on port 5213 ...
set PORT=5213
set VQ_OPEN=1
node server.js
pause
