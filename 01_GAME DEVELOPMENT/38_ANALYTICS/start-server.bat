@echo off
cd /d "%~dp0"
echo Starting 38_ANALYTICS on port 5638 ...
set PORT=5638
set VQ_OPEN=1
node server.js
pause
