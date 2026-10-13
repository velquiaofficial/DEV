@echo off
cd /d "%~dp0"
echo Starting 31_COMPETITOR on port 5631 ...
set PORT=5631
set VQ_OPEN=1
node server.js
pause
