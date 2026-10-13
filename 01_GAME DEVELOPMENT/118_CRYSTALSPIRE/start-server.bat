@echo off
cd /d "%~dp0"
echo Starting 118_GEMSTACK on port 5218 ...
set PORT=5218
set VQ_OPEN=1
node server.js
pause
