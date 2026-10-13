@echo off
cd /d "%~dp0"
echo Starting 87_FEATURE_FLAG on port 5687 ...
set PORT=5687
set VQ_OPEN=1
node server.js
pause
