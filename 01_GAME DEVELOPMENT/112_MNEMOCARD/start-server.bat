@echo off
cd /d "%~dp0"
echo Starting 112_MEMORYFLIP on port 5212 ...
set PORT=5212
set VQ_OPEN=1
node server.js
pause
