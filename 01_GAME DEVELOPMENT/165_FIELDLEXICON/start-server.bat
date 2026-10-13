@echo off
cd /d "%~dp0"
echo Starting 165_FIELDLEX on port 5265 ...
set PORT=5265
set VQ_OPEN=1
node server.js
pause
