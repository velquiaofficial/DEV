@echo off
cd /d "%~dp0"
echo Starting 148_LAVAWALL on port 5248 ...
set PORT=5248
set VQ_OPEN=1
node server.js
pause
