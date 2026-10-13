@echo off
cd /d "%~dp0"
echo Starting 40_CAST_BIBLE on port 5640 ...
set PORT=5640
set VQ_OPEN=1
node server.js
pause
