@echo off
cd /d "%~dp0"
echo Starting 142_DUNESURVIVE on port 5242 ...
set PORT=5242
set VQ_OPEN=1
node server.js
pause
