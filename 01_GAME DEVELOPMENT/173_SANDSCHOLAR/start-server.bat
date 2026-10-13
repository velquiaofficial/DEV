@echo off
cd /d "%~dp0"
echo Starting 173_SANDSMART on port 5273 ...
set PORT=5273
set VQ_OPEN=1
node server.js
pause
