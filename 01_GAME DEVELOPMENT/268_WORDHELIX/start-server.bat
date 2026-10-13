@echo off
cd /d "%~dp0"
echo Starting 268_WORDORBIT on port 5368 ...
set PORT=5368
set VQ_OPEN=1
node server.js
pause
