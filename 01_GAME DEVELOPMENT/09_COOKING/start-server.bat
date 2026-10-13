@echo off
cd /d "%~dp0"
echo Starting 09_COOKING on port 6310 ...
set PORT=6310
set VQ_OPEN=1
node server.js
pause
