@echo off
cd /d "%~dp0"
echo Starting 226_BULLETRAIN on port 5326 ...
set PORT=5326
set VQ_OPEN=1
node server.js
pause
