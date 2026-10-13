@echo off
cd /d "%~dp0"
echo Starting 187_AETHERDUEL on port 5287 ...
set PORT=5287
set VQ_OPEN=1
node server.js
pause
