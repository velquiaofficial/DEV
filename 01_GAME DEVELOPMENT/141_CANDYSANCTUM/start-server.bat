@echo off
cd /d "%~dp0"
echo Starting 141_CANDYSIEGE on port 5241 ...
set PORT=5241
set VQ_OPEN=1
node server.js
pause
