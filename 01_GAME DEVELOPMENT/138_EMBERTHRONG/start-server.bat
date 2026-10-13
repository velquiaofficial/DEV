@echo off
cd /d "%~dp0"
echo Starting 138_EMBERMOB on port 5238 ...
set PORT=5238
set VQ_OPEN=1
node server.js
pause
