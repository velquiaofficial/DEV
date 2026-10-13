@echo off
cd /d "%~dp0"
echo Starting 177_FROSTRUN on port 5277 ...
set PORT=5277
set VQ_OPEN=1
node server.js
pause
