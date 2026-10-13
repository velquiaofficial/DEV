@echo off
cd /d "%~dp0"
echo Starting 160_EMBERWORD on port 5260 ...
set PORT=5260
set VQ_OPEN=1
node server.js
pause
