@echo off
cd /d "%~dp0"
echo Starting 42_BEAT_FORGE on port 5642 ...
set PORT=5642
set VQ_OPEN=1
node server.js
pause
