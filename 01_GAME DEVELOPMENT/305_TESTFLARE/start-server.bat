@echo off
cd /d "%~dp0"
echo Starting 305_TESTSPARK on port 5405 ...
set PORT=5405
set VQ_OPEN=1
node server.js
pause
