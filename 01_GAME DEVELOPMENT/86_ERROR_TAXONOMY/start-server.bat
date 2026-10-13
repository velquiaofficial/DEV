@echo off
cd /d "%~dp0"
echo Starting 86_ERROR_TAXONOMY on port 5686 ...
set PORT=5686
set VQ_OPEN=1
node server.js
pause
