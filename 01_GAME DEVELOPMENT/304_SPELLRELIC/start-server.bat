@echo off
cd /d "%~dp0"
echo Starting 304_SPELLDOCK on port 5404 ...
set PORT=5404
set VQ_OPEN=1
node server.js
pause
