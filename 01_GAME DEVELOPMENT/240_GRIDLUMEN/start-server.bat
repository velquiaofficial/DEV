@echo off
cd /d "%~dp0"
echo Starting 240_GRIDGLOW on port 5340 ...
set PORT=5340
set VQ_OPEN=1
node server.js
pause
