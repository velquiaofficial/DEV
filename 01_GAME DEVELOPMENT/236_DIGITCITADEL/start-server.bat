@echo off
cd /d "%~dp0"
echo Starting 236_DIGITKEEP on port 5336 ...
set PORT=5336
set VQ_OPEN=1
node server.js
pause
