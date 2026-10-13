@echo off
cd /d "%~dp0"
echo Starting 201_NEONSUDO on port 5301 ...
set PORT=5301
set VQ_OPEN=1
node server.js
pause
