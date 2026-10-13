@echo off
cd /d "%~dp0"
echo Starting 129_STARMINER on port 5229 ...
set PORT=5229
set VQ_OPEN=1
node server.js
pause
