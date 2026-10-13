@echo off
cd /d "%~dp0"
echo Starting 183_CANDYRUN on port 5283 ...
set PORT=5283
set VQ_OPEN=1
node server.js
pause
