@echo off
cd /d "%~dp0"
echo Starting 41_PUZZLE_LAB on port 5641 ...
set PORT=5641
set VQ_OPEN=1
node server.js
pause
