@echo off
cd /d "%~dp0"
echo Starting 52_LEVEL_CURVE on port 5652 ...
set PORT=5652
set VQ_OPEN=1
node server.js
pause
