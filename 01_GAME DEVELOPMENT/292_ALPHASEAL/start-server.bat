@echo off
cd /d "%~dp0"
echo Starting 292_ALPHALOCK on port 5392 ...
set PORT=5392
set VQ_OPEN=1
node server.js
pause
