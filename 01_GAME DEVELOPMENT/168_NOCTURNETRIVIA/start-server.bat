@echo off
cd /d "%~dp0"
echo Starting 168_NIGHTTRIVIA on port 5268 ...
set PORT=5268
set VQ_OPEN=1
node server.js
pause
