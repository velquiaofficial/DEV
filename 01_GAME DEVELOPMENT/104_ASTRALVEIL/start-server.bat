@echo off
cd /d "%~dp0"
echo Starting 104_STARSWARM on port 5204 ...
set PORT=5204
set VQ_OPEN=1
node server.js
pause
