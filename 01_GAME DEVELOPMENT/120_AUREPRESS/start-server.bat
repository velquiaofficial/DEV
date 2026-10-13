@echo off
cd /d "%~dp0"
echo Starting 120_COINPRESS on port 5220 ...
set PORT=5220
set VQ_OPEN=1
node server.js
pause
