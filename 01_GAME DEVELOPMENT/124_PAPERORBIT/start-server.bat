@echo off
cd /d "%~dp0"
echo Starting 124_PAPER2048 on port 5224 ...
set PORT=5224
set VQ_OPEN=1
node server.js
pause
