@echo off
cd /d "%~dp0"
echo Starting 126_ORECLICK on port 5226 ...
set PORT=5226
set VQ_OPEN=1
node server.js
pause
