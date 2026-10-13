@echo off
cd /d "%~dp0"
echo Starting 33_KNOWLEDGE on port 5633 ...
set PORT=5633
set VQ_OPEN=1
node server.js
pause
