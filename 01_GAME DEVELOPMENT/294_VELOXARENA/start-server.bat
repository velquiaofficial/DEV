@echo off
cd /d "%~dp0"
echo Starting 294_VELOCITY on port 5394 ...
set PORT=5394
set VQ_OPEN=1
node server.js
pause
