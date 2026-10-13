@echo off
cd /d "%~dp0"
echo Starting 181_LEAFLEAP on port 5281 ...
set PORT=5281
set VQ_OPEN=1
node server.js
pause
