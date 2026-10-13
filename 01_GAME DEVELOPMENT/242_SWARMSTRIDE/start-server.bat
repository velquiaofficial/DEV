@echo off
cd /d "%~dp0"
echo Starting 242_SWARMRUN on port 5342 ...
set PORT=5342
set VQ_OPEN=1
node server.js
pause
