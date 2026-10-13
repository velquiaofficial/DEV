@echo off
cd /d "%~dp0"
echo Starting 21_LANGUAGE on port 5621 ...
set PORT=5621
set VQ_OPEN=1
node server.js
pause
