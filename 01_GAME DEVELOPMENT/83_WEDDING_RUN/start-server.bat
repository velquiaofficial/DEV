@echo off
cd /d "%~dp0"
echo Starting 83_WEDDING_RUN on port 5683 ...
set PORT=5683
set VQ_OPEN=1
node server.js
pause
