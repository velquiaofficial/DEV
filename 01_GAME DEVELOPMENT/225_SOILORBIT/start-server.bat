@echo off
cd /d "%~dp0"
echo Starting 225_SOILLOOP on port 5325 ...
set PORT=5325
set VQ_OPEN=1
node server.js
pause
