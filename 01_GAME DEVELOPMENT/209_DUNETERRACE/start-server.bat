@echo off
cd /d "%~dp0"
echo Starting 209_DUNEFIELD on port 5309 ...
set PORT=5309
set VQ_OPEN=1
node server.js
pause
