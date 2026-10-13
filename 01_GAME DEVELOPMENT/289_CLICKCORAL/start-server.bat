@echo off
cd /d "%~dp0"
echo Starting 289_CLICKREEF on port 5389 ...
set PORT=5389
set VQ_OPEN=1
node server.js
pause
