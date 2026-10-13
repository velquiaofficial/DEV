@echo off
cd /d "%~dp0"
echo Starting 212_EMBERPLOT on port 5312 ...
set PORT=5312
set VQ_OPEN=1
node server.js
pause
