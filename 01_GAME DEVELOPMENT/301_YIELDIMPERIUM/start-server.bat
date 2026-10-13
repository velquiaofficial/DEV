@echo off
cd /d "%~dp0"
echo Starting 301_YIELDHIVE on port 5401 ...
set PORT=5401
set VQ_OPEN=1
node server.js
pause
