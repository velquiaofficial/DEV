@echo off
cd /d "%~dp0"
echo Starting 137_FROSTHORDE on port 5237 ...
set PORT=5237
set VQ_OPEN=1
node server.js
pause
