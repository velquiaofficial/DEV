@echo off
cd /d "%~dp0"
echo Starting 216_SUMFORGE on port 5316 ...
set PORT=5316
set VQ_OPEN=1
node server.js
pause
