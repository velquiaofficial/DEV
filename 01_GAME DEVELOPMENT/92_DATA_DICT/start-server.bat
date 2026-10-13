@echo off
cd /d "%~dp0"
echo Starting 92_DATA_DICT on port 5692 ...
set PORT=5692
set VQ_OPEN=1
node server.js
pause
