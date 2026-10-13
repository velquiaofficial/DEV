@echo off
cd /d "%~dp0"
echo Starting 298_SLIPWAVE on port 5398 ...
set PORT=5398
set VQ_OPEN=1
node server.js
pause
