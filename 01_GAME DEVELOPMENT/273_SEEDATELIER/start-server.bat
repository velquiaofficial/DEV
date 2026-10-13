@echo off
cd /d "%~dp0"
echo Starting 273_SEEDMILL on port 5373 ...
set PORT=5373
set VQ_OPEN=1
node server.js
pause
