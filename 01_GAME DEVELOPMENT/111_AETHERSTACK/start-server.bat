@echo off
cd /d "%~dp0"
echo Starting 111_STACKDROP on port 5211 ...
set PORT=5211
set VQ_OPEN=1
node server.js
pause
