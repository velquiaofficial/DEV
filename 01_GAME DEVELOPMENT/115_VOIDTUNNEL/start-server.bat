@echo off
cd /d "%~dp0"
echo Starting 115_TUNNELRUN on port 5215 ...
set PORT=5215
set VQ_OPEN=1
node server.js
pause
