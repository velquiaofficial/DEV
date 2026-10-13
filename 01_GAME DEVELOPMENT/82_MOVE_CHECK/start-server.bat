@echo off
cd /d "%~dp0"
echo Starting 82_MOVE_CHECK on port 5682 ...
set PORT=5682
set VQ_OPEN=1
node server.js
pause
