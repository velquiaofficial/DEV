@echo off
cd /d "%~dp0"
echo Starting 103_SNAKEBIT on port 5203 ...
set PORT=5203
set VQ_OPEN=1
node server.js
pause
