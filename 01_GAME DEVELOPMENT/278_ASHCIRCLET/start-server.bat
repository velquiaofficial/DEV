@echo off
cd /d "%~dp0"
echo Starting 278_ASHCIRCLE on port 5378 ...
set PORT=5378
set VQ_OPEN=1
node server.js
pause
