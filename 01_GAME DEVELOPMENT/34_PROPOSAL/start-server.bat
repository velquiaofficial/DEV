@echo off
cd /d "%~dp0"
echo Starting 34_PROPOSAL on port 5634 ...
set PORT=5634
set VQ_OPEN=1
node server.js
pause
