@echo off
cd /d "%~dp0"
echo Starting 269_MINDCHIP on port 5369 ...
set PORT=5369
set VQ_OPEN=1
node server.js
pause
