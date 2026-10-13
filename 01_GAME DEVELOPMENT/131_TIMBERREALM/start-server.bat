@echo off
cd /d "%~dp0"
echo Starting 131_LUMBERTY on port 5231 ...
set PORT=5231
set VQ_OPEN=1
node server.js
pause
