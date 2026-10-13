@echo off
cd /d "%~dp0"
echo Starting 81_PET_CARE on port 5681 ...
set PORT=5681
set VQ_OPEN=1
node server.js
pause
