@echo off
cd /d "%~dp0"
echo Starting 202_SANDSUDO on port 5302 ...
set PORT=5302
set VQ_OPEN=1
node server.js
pause
