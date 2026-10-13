@echo off
cd /d "%~dp0"
echo Starting 158_RUNEGUESS on port 5258 ...
set PORT=5258
set VQ_OPEN=1
node server.js
pause
