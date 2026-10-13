@echo off
cd /d "%~dp0"
echo Starting 277_PROFITPOD on port 5377 ...
set PORT=5377
set VQ_OPEN=1
node server.js
pause
