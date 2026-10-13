@echo off
cd /d "%~dp0"
echo Starting 259_MANABRIDGE on port 5359 ...
set PORT=5359
set VQ_OPEN=1
node server.js
pause
