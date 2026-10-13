@echo off
cd /d "%~dp0"
echo Starting 36_LOYALTY on port 5636 ...
set PORT=5636
set VQ_OPEN=1
node server.js
pause
