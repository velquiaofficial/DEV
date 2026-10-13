@echo off
cd /d "%~dp0"
echo Starting 13_TRAVEL on port 6757 ...
set PORT=6757
set VQ_OPEN=1
node server.js
pause
