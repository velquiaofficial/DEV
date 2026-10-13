@echo off
cd /d "%~dp0"
echo Starting 08_AISHO on port 6479 ...
set PORT=6479
set VQ_OPEN=1
node server.js
pause
