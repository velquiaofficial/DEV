@echo off
cd /d "%~dp0"
echo Starting 01_BOARD GAME on port 6118 ...
set PORT=6118
set VQ_OPEN=1
node server.js
pause
