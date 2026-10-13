@echo off
cd /d "%~dp0"
echo Starting 252_DOUBLERUNE on port 5352 ...
set PORT=5352
set VQ_OPEN=1
node server.js
pause
