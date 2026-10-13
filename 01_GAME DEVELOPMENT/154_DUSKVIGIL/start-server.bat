@echo off
cd /d "%~dp0"
echo Starting 154_DUSKWATCH on port 5254 ...
set PORT=5254
set VQ_OPEN=1
node server.js
pause
