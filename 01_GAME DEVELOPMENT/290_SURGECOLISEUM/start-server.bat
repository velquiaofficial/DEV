@echo off
cd /d "%~dp0"
echo Starting 290_SURGEARENA on port 5390 ...
set PORT=5390
set VQ_OPEN=1
node server.js
pause
