@echo off
cd /d "%~dp0"
echo Starting 191_SWEETDUEL on port 5291 ...
set PORT=5291
set VQ_OPEN=1
node server.js
pause
