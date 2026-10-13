@echo off
cd /d "%~dp0"
echo Starting 195_PAPERDUEL on port 5295 ...
set PORT=5295
set VQ_OPEN=1
node server.js
pause
