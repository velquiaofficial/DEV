@echo off
cd /d "%~dp0"
echo Starting 57_NPC_SCHEDULE on port 5657 ...
set PORT=5657
set VQ_OPEN=1
node server.js
pause
