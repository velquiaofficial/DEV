@echo off
cd /d "%~dp0"
echo Starting 144_PIXELHUNT on port 5244 ...
set PORT=5244
set VQ_OPEN=1
node server.js
pause
