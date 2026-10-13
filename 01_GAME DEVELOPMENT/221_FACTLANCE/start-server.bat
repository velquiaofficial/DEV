@echo off
cd /d "%~dp0"
echo Starting 221_FACTDART on port 5321 ...
set PORT=5321
set VQ_OPEN=1
node server.js
pause
