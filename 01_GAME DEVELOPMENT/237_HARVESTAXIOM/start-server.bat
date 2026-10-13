@echo off
cd /d "%~dp0"
echo Starting 237_HARVESTX on port 5337 ...
set PORT=5337
set VQ_OPEN=1
node server.js
pause
