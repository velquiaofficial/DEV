@echo off
cd /d "%~dp0"
echo Starting 213_DUSKCROP on port 5313 ...
set PORT=5313
set VQ_OPEN=1
node server.js
pause
