@echo off
cd /d "%~dp0"
echo Starting 261_PLOTWAVE on port 5361 ...
set PORT=5361
set VQ_OPEN=1
node server.js
pause
