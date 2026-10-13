@echo off
cd /d "%~dp0"
echo Starting 314_HORDEFALL1 on port 5414 ...
set PORT=5414
set VQ_OPEN=1
node server.js
pause
