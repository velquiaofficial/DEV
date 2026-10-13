@echo off
cd /d "%~dp0"
echo Starting 265_IDLEORBIT on port 5365 ...
set PORT=5365
set VQ_OPEN=1
node server.js
pause
