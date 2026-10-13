@echo off
cd /d "%~dp0"
echo Starting 01_TETORIS on port 6533 ...
set PORT=6533
set VQ_OPEN=1
node server.js
pause
