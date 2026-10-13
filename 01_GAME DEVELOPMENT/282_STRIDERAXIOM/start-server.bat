@echo off
cd /d "%~dp0"
echo Starting 282_STRIDERX on port 5382 ...
set PORT=5382
set VQ_OPEN=1
node server.js
pause
