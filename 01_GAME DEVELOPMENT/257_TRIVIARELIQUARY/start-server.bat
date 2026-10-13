@echo off
cd /d "%~dp0"
echo Starting 257_TRIVIABOX on port 5357 ...
set PORT=5357
set VQ_OPEN=1
node server.js
pause
