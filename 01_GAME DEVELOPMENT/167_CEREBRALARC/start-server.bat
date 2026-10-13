@echo off
cd /d "%~dp0"
echo Starting 167_BRAINPOP on port 5267 ...
set PORT=5267
set VQ_OPEN=1
node server.js
pause
