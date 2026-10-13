@echo off
cd /d "%~dp0"
echo Starting 280_HINTLANE on port 5380 ...
set PORT=5380
set VQ_OPEN=1
node server.js
pause
