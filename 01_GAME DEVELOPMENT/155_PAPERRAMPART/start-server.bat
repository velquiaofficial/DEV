@echo off
cd /d "%~dp0"
echo Starting 155_PAPERFORT on port 5255 ...
set PORT=5255
set VQ_OPEN=1
node server.js
pause
