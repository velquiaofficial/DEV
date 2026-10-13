@echo off
cd /d "%~dp0"
echo Starting 88_RELEASE_TRAIN on port 5688 ...
set PORT=5688
set VQ_OPEN=1
node server.js
pause
