@echo off
cd /d "%~dp0"
echo Starting 272_CELLCRAFT on port 5372 ...
set PORT=5372
set VQ_OPEN=1
node server.js
pause
