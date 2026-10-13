@echo off
cd /d "%~dp0"
echo Starting 02_JINRO on port 6247 ...
set PORT=6247
set VQ_OPEN=1
node server.js
pause
