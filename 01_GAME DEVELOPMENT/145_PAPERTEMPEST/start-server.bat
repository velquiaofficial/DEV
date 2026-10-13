@echo off
cd /d "%~dp0"
echo Starting 145_PAPERPANIC on port 5245 ...
set PORT=5245
set VQ_OPEN=1
node server.js
pause
