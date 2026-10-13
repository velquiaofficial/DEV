@echo off
cd /d "%~dp0"
echo Starting 58_CUTSCENE_BOARD on port 5658 ...
set PORT=5658
set VQ_OPEN=1
node server.js
pause
