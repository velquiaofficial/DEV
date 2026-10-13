@echo off
cd /d "%~dp0"
echo Starting 136_NIGHTSWARM on port 5236 ...
set PORT=5236
set VQ_OPEN=1
node server.js
pause
