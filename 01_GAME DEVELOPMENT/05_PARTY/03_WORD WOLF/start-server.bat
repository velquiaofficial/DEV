@echo off
cd /d "%~dp0"
echo Starting 03_WORD WOLF on port 6170 ...
set PORT=6170
set VQ_OPEN=1
node server.js
pause
