@echo off
cd /d "%~dp0"
echo Starting 308_NUMBERDOCK on port 5408 ...
set PORT=5408
set VQ_OPEN=1
node server.js
pause
