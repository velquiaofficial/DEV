@echo off
cd /d "%~dp0"
echo Starting 147_ICEBASTION on port 5247 ...
set PORT=5247
set VQ_OPEN=1
node server.js
pause
