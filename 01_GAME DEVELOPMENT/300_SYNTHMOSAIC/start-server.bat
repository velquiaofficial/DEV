@echo off
cd /d "%~dp0"
echo Starting 300_SYNTHTILE on port 5400 ...
set PORT=5400
set VQ_OPEN=1
node server.js
pause
