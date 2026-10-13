@echo off
cd /d "%~dp0"
echo Starting 99_CHANGELOG on port 5699 ...
set PORT=5699
set VQ_OPEN=1
node server.js
pause
