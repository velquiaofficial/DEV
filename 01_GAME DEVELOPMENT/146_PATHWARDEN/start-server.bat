@echo off
cd /d "%~dp0"
echo Starting 146_PATHGUARD on port 5246 ...
set PORT=5246
set VQ_OPEN=1
node server.js
pause
