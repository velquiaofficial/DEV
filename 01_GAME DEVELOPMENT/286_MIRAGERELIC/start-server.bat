@echo off
cd /d "%~dp0"
echo Starting 286_MIRAGEPAD on port 5386 ...
set PORT=5386
set VQ_OPEN=1
node server.js
pause
