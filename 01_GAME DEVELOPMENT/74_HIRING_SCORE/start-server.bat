@echo off
cd /d "%~dp0"
echo Starting 74_HIRING_SCORE on port 5674 ...
set PORT=5674
set VQ_OPEN=1
node server.js
pause
