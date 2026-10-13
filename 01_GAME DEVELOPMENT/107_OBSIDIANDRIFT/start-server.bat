@echo off
cd /d "%~dp0"
echo Starting 107_ROCKFIELD on port 5207 ...
set PORT=5207
set VQ_OPEN=1
node server.js
pause
