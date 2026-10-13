@echo off
cd /d "%~dp0"
echo Starting 179_NEONRUN on port 5279 ...
set PORT=5279
set VQ_OPEN=1
node server.js
pause
