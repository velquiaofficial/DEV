@echo off
cd /d "%~dp0"
echo Starting 46_PANTRY_QUEST on port 5646 ...
set PORT=5646
set VQ_OPEN=1
node server.js
pause
