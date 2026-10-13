@echo off
cd /d "%~dp0"
echo Starting 291_GATEWATCH on port 5391 ...
set PORT=5391
set VQ_OPEN=1
node server.js
pause
