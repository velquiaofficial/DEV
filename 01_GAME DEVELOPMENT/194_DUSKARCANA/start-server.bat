@echo off
cd /d "%~dp0"
echo Starting 194_DUSKHAND on port 5294 ...
set PORT=5294
set VQ_OPEN=1
node server.js
pause
