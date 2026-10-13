@echo off
cd /d "%~dp0"
echo Starting 235_HANDSTORM on port 5335 ...
set PORT=5335
set VQ_OPEN=1
node server.js
pause
